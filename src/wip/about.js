import React from "react"
// import { Link } from "gatsby"

import Layout from "../components/layout"
// import Image from "../components/image"
import SEO from "../components/seo"

import Img from "gatsby-image";
import { useStaticQuery, graphql } from 'gatsby';

const AboutPage = () => {
    const data = useStaticQuery(graphql`
        query MyQuery {
            allFile(filter: {relativePath: {glob: "**/2019-10-13-Hardergrat/*"}}) {
                edges {
                node {
                    base
                    childImageSharp {
                    fluid {
                        aspectRatio
                        base64
                        src
                        srcSet
                        sizes,
                        tracedSVG
                    }
                    }
                }
                }
            }
            }
    `);
    return (<Layout>
        <SEO title="About"/>
        <h1>about</h1>
        {data.allFile.edges.map(({node}) => (
            <Img fluid={node.childImageSharp.fluid} />
        ))}
    </Layout>
    )
}

export default AboutPage;