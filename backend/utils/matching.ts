export async function processUrl(url: string): Promise<string | null> {
    url = url.trim();
  
    const patterns = {
      arxiv: /https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/,
      pmc: /https?:\/\/(?:www\.)?ncbi\.nlm\.nih\.gov\/pmc\/articles\/PMC(\d+)\/?/,
      doi: /https?:\/\/(?:dx\.)?doi\.org\/(10\.\d+\/[-._;()\/:A-Za-z0-9]+)/,
    };
  
    try {
      const parsed = new URL(url);
      if (!parsed.protocol || !parsed.host) {
        return null;
      }
    } catch {
      return null;
    }
  
    let processedUrl: string | null = null;
  
    if (patterns.arxiv.test(url)) {
      processedUrl = url.replace("/abs/", "/pdf/") + ".pdf";
    } else if (patterns.pmc.test(url)) {
      processedUrl = url + "/pdf";
    } else if (patterns.doi.test(url)) {
      const doiMatch = url.match(patterns.doi);
      if (doiMatch) {
        processedUrl = `https://doi.org/${doiMatch[1]}`;
      }
    } else {
      processedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : null;
    }
  
    if (processedUrl) {
      try {
        const headers = { "User-Agent": "Mozilla/5.0" };
  
        let response = await fetch(processedUrl, {
          method: "HEAD",
          headers,
          redirect: "follow",
        });
  
        if (response.status === 405) {
          response = await fetch(processedUrl, {
            method: "GET",
            headers,
          });
        }
  
        const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  
        if (contentType.includes("application/pdf")) {
          return processedUrl;
        }
        return null;
      } catch {
        return null;
      }
    }
  
    return null;
  }