import { CustomLinkData } from '@/components/extension/custom-link-mark'

interface LinkValidationContext {
  defaultValidate: (url: string) => boolean
  defaultProtocol: string
  protocols: Array<string | { scheme: string }>
}

export const textAlignConfig = {
  types: ['heading', 'paragraph'],
  alignments: ['left', 'center', 'right', 'justify'],
}

export const highlightConfig = {
  multicolor: true,
}

export const placeholderConfig = {
  placeholder: 'Write something.',
}

export const customLinkConfig = {
  HTMLAttributes: {
    class: 'custom-link',
  },
  onClick: ({ href, data }: { href: string; data: CustomLinkData }) => {
    // TODO: Implement custom link functionality, probably opens a new sidebar
    console.log(href, data)
  },
}

export const linkConfig = {
  openOnClick: true,
  autolink: true,
  defaultProtocol: 'https',
  protocols: ['http', 'https'],
  isAllowedUri: (url: string, ctx: LinkValidationContext) => {
    try {
      const parsedUrl = url.includes(':')
        ? new URL(url)
        : new URL(`${ctx.defaultProtocol}://${url}`)

      if (!ctx.defaultValidate(parsedUrl.href)) {
        return false
      }

      // disallowed protocols
      const disallowedProtocols = ['ftp', 'file', 'mailto']
      const protocol = parsedUrl.protocol.replace(':', '')

      if (disallowedProtocols.includes(protocol)) {
        return false
      }

      // only allow protocols specified in ctx.protocols
      const allowedProtocols = ctx.protocols.map((p) =>
        typeof p === 'string' ? p : p.scheme
      )

      if (!allowedProtocols.includes(protocol)) {
        return false
      }

      // disallowed domains
      const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
      const domain = parsedUrl.hostname

      if (disallowedDomains.includes(domain)) {
        return false
      }

      // all checks have passed
      return true
    } catch {
      return false
    }
  },
  shouldAutoLink: (url: string) => {
    try {
      // construct URL
      const parsedUrl = url.includes(':')
        ? new URL(url)
        : new URL(`https://${url}`)

      // only auto-link if the domain is not in the disallowed list
      const disallowedDomains = [
        'example-no-autolink.com',
        'another-no-autolink.com',
      ]
      const domain = parsedUrl.hostname

      return !disallowedDomains.includes(domain)
    } catch {
      return false
    }
  },
}
