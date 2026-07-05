// One method for "viewing" a file, used everywhere a View button appears.
// Takes whichever authenticated download function applies (files.js's or
// projects.js's downloadFile — they hit different routes/models) plus the
// id, fetches the blob through that endpoint, and opens it in a new tab.
export async function viewFile(downloadFn, fileId) {
    const res = await downloadFn(fileId)
    const url = URL.createObjectURL(res.data)
    window.open(url, "_blank")
    // give the new tab time to actually load the blob before freeing it
    setTimeout(() => URL.revokeObjectURL(url), 60000)
}