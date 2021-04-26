import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

const AboutPage = () => {

  return (<Layout>
      <SEO title="About"/>
      <h1>Hi! I'm Vasyl Dizhak.</h1>
      <p>I'm a software engineer working as a Project Lead at <a target="_blank" rel="noreferrer" href="https://moneypark.ch">MoneyPark</a> focusing on Python/Django stack.</p>
      <p>For the last 14 years, I've been managing, developing, testing, and maintaining software applications and projects in areas of
        Fintech, GeoSpatial, Healthcare, and Social Networking.</p>
      <p>I love GIS and occasionally contribute to open-source projects. </p>

      <p>You can reach me by e-mail: <a href="mailto:hi@dizhak.com">hi@vasyl.dizhak</a> or on twitter <a target="_blank" rel="noreferrer" href="https://twitter.com/rootart">@rootart</a></p>
    </Layout>
  )
}

export default AboutPage;