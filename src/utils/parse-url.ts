export const convertToProperUrl = (urlSafeString: string): string => {
  const withColons = urlSafeString.replace(/^([a-zA-Z]+)\/\//, '$1://')
  return decodeURIComponent(withColons)
}
