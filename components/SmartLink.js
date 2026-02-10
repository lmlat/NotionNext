import Link from 'next/link'
import { siteConfig } from '@/lib/config'

// 对查询参数进行编码
const encodeQueryParams = (href) => {
  if (typeof href === 'string') {
    // 对字符串形式的URL进行编码
    try {
      const url = new URL(href, siteConfig('LINK') || 'http://localhost')
      url.search = new URLSearchParams(url.searchParams).toString()
      return url.toString()
    } catch {
      // 如果不是完整URL，尝试编码其中的查询参数
      const [path, query] = href.split('?')
      if (!query) return href
      
      const params = new URLSearchParams(query)
      // 编码所有参数值
      params.forEach((value, key) => {
        if (value) params.set(key, encodeURIComponent(value))
      })
      
      return path + (params.toString() ? '?' + params.toString() : '')
    }
  }
  
  // 对象形式的href（Next.js格式）
  if (href && typeof href === 'object') {
    const encoded = { ...href }
    
    // 编码path中的查询参数（如 /blog/[category] 形式）
    if (encoded.pathname && encoded.pathname.includes('[')) {
      // 对于动态路由，Next.js会处理编码，这里只需传递原始值
      console.log('动态路由路径，Next.js将自动处理编码:', encoded.pathname)
    }
    
    // 编码query对象中的值
    if (encoded.query && typeof encoded.query === 'object') {
      const encodedQuery = {}
      for (const [key, value] of Object.entries(encoded.query)) {
        encodedQuery[key] = typeof value === 'string' ? 
          encodeURIComponent(value) : value
      }
      encoded.query = encodedQuery
    }
    
    return encoded
  }
  return href
}

// 过滤 <a> 标签不能识别的 props
const filterDOMProps = props => {
  const { passHref, legacyBehavior, ...rest } = props
  return rest
}

const SmartLink = ({ href, children, ...rest }) => {
  const LINK = siteConfig('LINK')
  
  // 步骤1：统一编码href
  const encodedHref = encodeQueryParams(href)
  
  // 步骤2：判断是否为外部链接
  let urlString = ''
  let isExternal = false

  if (typeof encodedHref === 'string') {
    urlString = encodedHref
    isExternal = urlString.startsWith('http') && !urlString.startsWith(LINK)
  } else if (
    typeof encodedHref === 'object' &&
    encodedHref !== null &&
    typeof encodedHref.pathname === 'string'
  ) {
    urlString = encodedHref.pathname
    // 对于对象形式的href，基于完整的URL判断
    const fullUrl = LINK + (urlString.startsWith('/') ? '' : '/') + urlString
    isExternal = fullUrl.startsWith('http') && !fullUrl.startsWith(LINK)
  }

  // 步骤3：渲染对应链接
  if (isExternal) {
    // 外部链接 - 确保是字符串格式
    let externalUrl = ''
    
    if (typeof encodedHref === 'string') {
      externalUrl = encodedHref
    } else if (typeof encodedHref === 'object') {
      // 将对象格式转换为字符串URL
      const basePath = encodedHref.pathname || ''
      const queryStr = encodedHref.query ? 
        '?' + new URLSearchParams(encodedHref.query).toString() : ''
      externalUrl = basePath + queryStr
      
      // 如果还不是完整URL，加上base URL
      if (!externalUrl.startsWith('http')) {
        externalUrl = (LINK || '') + (externalUrl.startsWith('/') ? '' : '/') + externalUrl
      }
    }

    return (
      <a
        href={externalUrl}
        target='_blank'
        rel='noopener noreferrer'
        {...filterDOMProps(rest)}>
        {children}
      </a>
    )
  }

  // 内部链接（可为对象形式）
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}

export default SmartLink
