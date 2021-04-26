import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { graphql } from "gatsby"
export default function Template({ data }) {
  const { markdownRemark } = data // data.markdownRemark holds your post data
  const { frontmatter, html, fields} = markdownRemark
  return (
      <Layout>
        <SEO title={frontmatter.title} />
        <div className="blog-post">
        <h1>{frontmatter.title}</h1>
        <h2>{frontmatter.date} - {fields.readingTime.text}</h2>
        <div
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: html }}
        />
        </div>
    </Layout>
  )
}
export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
      }
      fields {
        readingTime {
          words
          text
          time
        }
      }
    }
  }
`