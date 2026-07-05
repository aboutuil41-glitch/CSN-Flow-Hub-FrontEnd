import { downloadFile } from "../api/files"
import { viewFile } from "../utils/viewFile"
import "../layouts/Files.css"

function FilePreview({ file }) {
    const ext = file.name.split(".").pop().toLowerCase()

    return (
        <div className="file-preview">
            <div className="no-preview-icon">
                <span className="ext">.{ext}</span>
            </div>
            <button className="btn btn-ghost" onClick={() => viewFile(downloadFile, file.id)}>
                View
            </button>
        </div>
    )
}

export default FilePreview