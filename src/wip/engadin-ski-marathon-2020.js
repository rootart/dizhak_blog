import React from "react"

import Layout from "../components/layout"
// import Image from "../components/image"
import SEO from "../components/seo"

import Img from "gatsby-image";

import { useStaticQuery, graphql, Link } from 'gatsby';

const Engadin2020Page = () => {
    const data = useStaticQuery(graphql`
        query Engadindata {
            allFile(filter: {relativePath: {glob: "**/2020/03/engadin-ski-marathon/*"}}) {
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
        <SEO title="2020 Engadin ski marathon experience"/>
        <h1>2020 Engadin ski marathon experience</h1>


        <article>
            <section>
                <h2>High hopes and dreams</h2>
                <p>
                    Year 2020 was is my second season competing in cross country skiing and Engadin was supposed to be a pinnacle in both peaking in my form. 
                    
                </p>
            </section>
        </article>
        {data.allFile.edges.map(({node}) => (
            <Img fluid={node.childImageSharp.fluid} />
        ))}
    </Layout>
    )
}

export default Engadin2020Page;