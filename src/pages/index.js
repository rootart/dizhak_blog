import React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = () => {

  const data = useStaticQuery(graphql`
    query AllPages {
      allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
        nodes {
          frontmatter {
            title
            date(formatString: "YYYY-MM-DD")
            path
            author
          }
        }
      }
    }`);

  return (<Layout>
    <SEO title="Vasyl Dizhak (Blog about coding, triathlon and photography)" />
    {
      data.allMarkdownRemark.nodes.map((node) => (
        <div style={{
          marginBottom: `2rem`
        }}>
          <Link
            style={{
              color: `#2d3748`,
              textDecoration: 'none',
              fontSize: `1.5rem`
            }}
            to={node.frontmatter.path} key={node.frontmatter.path}>{node.frontmatter.title}</Link>
          <span
            style={{
              fontSize: `1.25rem`,
              color: `#5f6c80`,
              display: 'block'
            }}
          >{node.frontmatter.date}</span>
        </div>
      ))
    }
  </Layout>
  )
}

export default IndexPage
