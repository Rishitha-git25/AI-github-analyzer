const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/analyze", async (req, res) => {
  const { repoLink } = req.body;
  const parts = repoLink.split("/");

  const owner = parts[3];
  const repo = parts[4];

  console.log("Repo link received:", repoLink);
  console.log("Owner:", owner);
  console.log("Repo:", repo);
  try {
    const githubApi = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const response = await axios.get(githubApi);
    
    
    const repoInfo = await axios.get(
  `https://api.github.com/repos/${owner}/${repo}`
);
const repoDetails = {
  owner: repoInfo.data.owner.login,
  stars: repoInfo.data.stargazers_count,
  language: repoInfo.data.language,
  updated: repoInfo.data.updated_at
};
   const files = response.data;

    const fileContents = [];
    for (const file of files.slice(0, 5)) {
      if (file.type === "file") {
        const fileData = await axios.get(file.download_url);
        fileContents.push({
          name: file.name,
          content: fileData.data
        });
      }
    }

    const combinedCode = fileContents
      .map(file => `File: ${file.name}\n${file.content}`)
      .join("\n\n");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Explain this GitHub repository clearly in bullet points with sections for below and keep the files heading bold:

1. Project Purpose
2. Main Files
3. Technologies Used
4. How the Project Works
5. Beginner Difficulty Level


Use short bullet points and simple sentences.


${combinedCode}`
        }
      ],
      model: "llama-3.1-8b-instant"
    });

    const analysis = completion.choices[0].message.content;
    console.log(files);
    

    res.json({
      message: "Repository extracted successfully",
      owner, repo, analysis, files, repoDetails
    });
  } catch (error) {
    console.error("Error fetching repo contents:", error);
    return res.status(500).json({ message: "Error fetching repository contents" });
  }
});
router.post("/explain-file", async (req, res) => {
  const { path, repoLink } = req.body;
  const parts = repoLink.split("/");
  const owner = parts[3];
  const repo = parts[4];

  try {
    const fileApi = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await axios.get(fileApi);
    if (response.data.type === "dir") {
      return res.json({ explanation: "This is a directory containing files." });
    }
    const fileContent = response.data.content ? Buffer.from(response.data.content, 'base64').toString('utf-8') : response.data;

    console.log("Explaining file:", path, "Content length:", fileContent.length);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Explain what this file does in simple terms:

${fileContent}`
        }
      ],
      model: "llama-3.1-8b-instant"
    });

    const explanation = completion.choices[0].message.content;

    res.json({ explanation });
  } catch (error) {
    console.error("Error explaining file:", error);
    return res.status(500).json({ message: "Error explaining file" });
  }
});

module.exports = router;
