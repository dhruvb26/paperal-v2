'use server'

import neo4j from 'neo4j-driver'

const NODE_COLORS = {
  Task: '#daed97',
  Origin: '#c0ddbf',
  Cited: '#ff9fd0   ',
  default: '#f5f5f5',
}

export async function getGraph() {
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
      RETURN n, r, m
      `,
      {},
      { database: 'neo4j' }
    )

    const nodesSet = new Set()
    const links: any[] = []

    records.forEach((record) => {
      const sourceNode = record.get('n')
      const relationship = record.get('r')
      const targetNode = record.get('m')

      if (sourceNode) {
        nodesSet.add(JSON.stringify(serializeNode(sourceNode)))
      }

      if (targetNode) {
        nodesSet.add(JSON.stringify(serializeNode(targetNode)))
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
