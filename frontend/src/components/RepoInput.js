import { useState } from "react";
import "./RepoInput.css";
//import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

function RepoInput() {

    const [repoLink, setRepoLink] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [files, setFiles] = useState([]);
    const [fileExplanation, setFileExplanation] = useState("");
    const [repoDetails, setRepoDetails] = useState(null);

    const handleAnalyze = async () => {

        setLoading(true);
        setAnalysis("");

        try {

            const response = await fetch("https://ai-github-analyzer-acsj.onrender.com/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ repoLink })
            });

            const data = await response.json();

            console.log('data:', data);

            setAnalysis(data.analysis);
            setFiles(data.files);// Store file info for potential future use
            setRepoDetails(data.repoDetails);

        } catch (error) {
            console.error(error);
        }

        setLoading(false);

    };
    const explainFile = async (file) => {
        try {
            const response = await fetch("https://ai-github-analyzer-acsj.onrender.com/api/repo/explain-file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path: file.path, repoLink }),
            });

            if (!response.ok) {
                console.error("Explain-file request failed", response.status, response.statusText);
                setFileExplanation("Unable to fetch file explanation.");
                return;
            }

            const data = await response.json();
            setFileExplanation(data.explanation);

        } catch (error) {
            console.error(error);
        }
    };
    console.log("files:", files);

    const downloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("GitHub Repository Analysis", 20, 20);

        doc.setFontSize(12);

        let y = 40;

        analysis.split("\n").forEach(line => {
            doc.text(line, 20, y);
            y += 8;
        });

        doc.save("repo-analysis.pdf");
    };

    return (
        <div className="container">
            <div className="card">

                <h1>AI GitHub Analyzer</h1>

                <input
                    type="text"
                    placeholder="Paste GitHub repo link"
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    className="repo-input"
                />

                <button onClick={handleAnalyze} className="analyze-btn">
                    Analyze
                </button>
                <button onClick={downloadPDF}>Download PDF</button>


                {loading && <p>Analyzing repository...</p>}
                {repoDetails && (
                    <div className="repo-card">

                        <h3>Repository Info</h3>

                        <p><b>Owner:</b> {repoDetails.owner}</p>
                        <p><b>Stars:</b> ⭐ {repoDetails.stars}</p>
                        <p><b>Language:</b> {repoDetails.language}</p>
                        <p><b>Last Updated:</b> {repoDetails.updated}</p>

                    </div>
                )}

                {analysis && (
                    <div className="result-box">

                        <button
                            className="copy-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(analysis);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 5000);
                            }}
                        >
                            {copied ? "Copied ✓" : "📋 Copy"}
                        </button>

                        <div className="analysis-text">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                        {files && files.length > 0 && (
                            <div className="file-tree">
                                <h3>Analyzed Files:</h3>
                                <ul>
                                    {files.map((file, index) => (
                                        <li
                                            key={index}
                                            onClick={() => explainFile(file)}
                                            className="file-item"
                                        >
                                            {file.type === "dir" ? "📁" : "📄"} {file.name}
                                        </li>
                                    ))}
                                </ul>

                            </div>
                        )}

                        {fileExplanation && (
                            <div className="file-explanation">
                                <h3>File Explanation</h3>
                                <p>{fileExplanation}</p>
                            </div>
                        )}

                    </div>
                )}


            </div>
        </div>
    );
}

export default RepoInput;
