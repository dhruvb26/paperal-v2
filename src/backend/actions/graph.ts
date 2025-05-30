'use server'

import neo4j from 'neo4j-driver'

const NODE_COLORS = {
  Task: '#daed97',
  Origin: '#c0ddbf',
  Cited: '#ff9fd0   ',
  default: '#f5f5f5',
}

interface Citation {
  authors: string[]
  title: string
  year: number
  order: number
}

interface Segment {
  content: string
  llm?: string
}

interface Chunk {
  chunk_id: string
  segments: Segment[]
}

interface ChunkData {
  content: string
  citation_orders: string[]
}

export async function getGraph(taskId: string) {
  try {
    const URI = process.env.NEO4J_URI!
    const USER = 'neo4j'
    const PASSWORD = process.env.NEO4J_PASSWORD!

    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))

    const { records } = await driver.executeQuery(
      `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      WHERE NOT (n:Cited AND r IS NOT NULL)
      WITH COLLECT({n: n, r: r, m: m}) as all_paths
      MATCH (task:Task {task_id: $taskId})
      UNWIND all_paths as path
      RETURN path.n as n, path.r as r, path.m as m, task
      `,
      { taskId },
      { database: 'neo4j' }
    )

    const nodesSet = new Set()
    const links: any[] = []

    records.forEach((record) => {
      const sourceNode = record.get('n')
      const relationship = record.get('r')
      const targetNode = record.get('m')
      const taskNode = record.get('task')

      if (sourceNode) {
        nodesSet.add(JSON.stringify(serializeNode(sourceNode)))
      }

      if (targetNode) {
        nodesSet.add(JSON.stringify(serializeNode(targetNode)))
      }

      if (taskNode) {
        nodesSet.add(JSON.stringify(serializeNode(taskNode)))
      }

      if (relationship && sourceNode && targetNode) {
        links.push(
          serializeRelationship(
            relationship,
            sourceNode.elementId,
            targetNode.elementId
          )
        )
      }
    })

    const nodes = Array.from(nodesSet).map((node) => JSON.parse(node as string))
    const graphData = {
      nodes,
      links,
    }

    return graphData
  } catch (error) {
    console.error('Error connecting to Neo4j:', error)
    return null
  }
}

function serializeNode(node: any) {
  if (!node) return null

  const properties = node.properties
    ? Object.fromEntries(
        Object.entries(node.properties).map(([key, value]) => {
          if (
            value &&
            typeof value === 'object' &&
            'low' in value &&
            'high' in value
          ) {
            return [key, value.low]
          }
          return [key, value]
        })
      )
    : {}

  return {
    id: node.elementId,
    labels: node.labels,
    color: NODE_COLORS[node.labels[0] as keyof typeof NODE_COLORS],
    ...properties,
  }
}

function serializeRelationship(
  relationship: any,
  sourceId: string,
  targetId: string
) {
  if (!relationship) return null

  const properties = relationship.properties
    ? Object.fromEntries(
        Object.entries(relationship.properties).map(([key, value]) => {
          if (
            value &&
            typeof value === 'object' &&
            'low' in value &&
            'high' in value
          ) {
            return [key, value.low]
          }
          return [key, value]
        })
      )
    : {}

  return {
    id: relationship.elementId,
    source: sourceId,
    target: targetId,
    type: relationship.type,
  }
}

export async function addCitedNodes(citedNodes: Citation[]) {
  try {
    const URI = process.env.NEO4J_URI!
    const USER = 'neo4j'
    const PASSWORD = process.env.NEO4J_PASSWORD!
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))

    for (const node of citedNodes) {
      await driver.executeQuery(
        `
        CREATE (c:Cited {
          authors: $authors,
          title: $title,
          year: $year,
          order: $order
        })
        `,
        {
          authors: JSON.stringify(node.authors),
          title: node.title,
          year: node.year,
          order: node.order,
        },
        { database: 'neo4j' }
      )
    }

    await driver.close()
  } catch (error) {
    console.error('Error adding cited nodes:', error)
    throw error
  }
}

export async function addOriginNodes(
  chunksData: Record<string, ChunkData>,
  taskId: string
) {
  try {
    const URI = process.env.NEO4J_URI!
    const USER = 'neo4j'
    const PASSWORD = process.env.NEO4J_PASSWORD!
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))

    // Create task node
    await driver.executeQuery(
      `
      CREATE (t:Task {
        task_id: $taskId
      })
      `,
      { taskId },
      { database: 'neo4j' }
    )

    // Create origin nodes and relationships
    for (const [chunkId, data] of Object.entries(chunksData)) {
      await driver.executeQuery(
        `
        MATCH (t:Task {task_id: $taskId})
        CREATE (o:Origin {
          content: $content,
          chunk_id: $chunkId
        })
        CREATE (t)-[:HAS_ORIGIN]->(o)
        WITH o
        UNWIND $citationOrders AS order
        MATCH (c:Cited {order: toInteger(order)})
        CREATE (o)-[:CITED]->(c)
        `,
        {
          content: data.content,
          chunkId,
          taskId,
          citationOrders: data.citation_orders,
        },
        { database: 'neo4j' }
      )
    }

    await driver.close()
  } catch (error) {
    console.error('Error adding origin nodes:', error)
    throw error
  }
}

export async function processCitationsAndChunks(
  citationsData: Omit<Citation, 'order'>[],
  totalChunks: Chunk[],
  taskId: string
) {
  try {
    // Process citations
    const citationsWithOrder = citationsData.map((citation, index) => ({
      ...citation,
      order: index + 1,
    }))

    await addCitedNodes(citationsWithOrder)

    // Process chunks
    const chunksData: Record<string, ChunkData> = {}

    for (const chunk of totalChunks) {
      const segmentsText: string[] = []
      const citationOrders: string[] = []

      for (const segment of chunk.segments) {
        segmentsText.push(segment.content)
        if (segment.llm) {
          const orders = segment.llm
            .trim()
            .replace(/[\[\]]/g, '')
            .split(',')
            .map((order) => order.trim())
            .filter(Boolean)
          citationOrders.push(...orders)
        }
      }

      chunksData[chunk.chunk_id] = {
        content: segmentsText.join('\n'),
        citation_orders: citationOrders,
      }
    }

    await addOriginNodes(chunksData, taskId)
  } catch (error) {
    console.error('Error processing citations and chunks:', error)
    throw error
  }
}
