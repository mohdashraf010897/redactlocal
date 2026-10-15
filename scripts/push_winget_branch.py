#!/usr/bin/env python3
"""
Pushes Winget manifest files to personal fork without cloning the multi-gigabyte repository.
"""

import base64
import json
import os
import subprocess
import sys

def gh_api(endpoint, method="GET", payload=None):
    cmd = ["env", "-u", "GH_TOKEN", "gh", "api"]
    if method != "GET":
        cmd.extend(["--method", method])
    cmd.append(endpoint)
    if payload:
        cmd.extend(["--input", "-"])
        proc = subprocess.run(cmd, input=json.dumps(payload), text=True, capture_output=True)
    else:
        proc = subprocess.run(cmd, text=True, capture_output=True)

    if proc.returncode != 0:
        raise RuntimeError(f"GH API {method} {endpoint} failed: {proc.stderr}\n{proc.stdout}")
    return json.loads(proc.stdout)

def main():
    owner = "mohdashraf010897"
    repo = "winget-pkgs"
    branch = "add-redactlocal-1.0.1"

    manifest_dir = "distribution/winget/manifests/r/RedactLocal/RedactLocal/1.0.1"
    files_to_commit = [
        "RedactLocal.RedactLocal.yaml",
        "RedactLocal.RedactLocal.installer.yaml",
        "RedactLocal.RedactLocal.locale.en-US.yaml",
    ]

    print(f"Creating blobs for {len(files_to_commit)} manifest files...")
    tree_items = []
    for fname in files_to_commit:
        fpath = os.path.join(manifest_dir, fname)
        with open(fpath, "rb") as f:
            b64_content = base64.b64encode(f.read()).decode("utf-8")
        
        blob_resp = gh_api(f"repos/{owner}/{repo}/git/blobs", method="POST", payload={
            "content": b64_content,
            "encoding": "base64"
        })
        blob_sha = blob_resp["sha"]
        repo_path = f"manifests/r/RedactLocal/RedactLocal/1.0.1/{fname}"
        tree_items.append({
            "path": repo_path,
            "mode": "100644",
            "type": "blob",
            "sha": blob_sha
        })
        print(f"  ✅ Blob {fname} -> {blob_sha}")

    # Get branch ref
    ref_resp = gh_api(f"repos/{owner}/{repo}/git/ref/heads/{branch}")
    base_commit_sha = ref_resp["object"]["sha"]
    print(f"Base commit on {branch}: {base_commit_sha}")

    # Create tree
    tree_resp = gh_api(f"repos/{owner}/{repo}/git/trees", method="POST", payload={
        "base_tree": base_commit_sha,
        "tree": tree_items
    })
    tree_sha = tree_resp["sha"]
    print(f"Created tree: {tree_sha}")

    # Create commit
    commit_resp = gh_api(f"repos/{owner}/{repo}/git/commits", method="POST", payload={
        "message": "New package: RedactLocal.RedactLocal version 1.0.1",
        "tree": tree_sha,
        "parents": [base_commit_sha]
    })
    commit_sha = commit_resp["sha"]
    print(f"Created commit: {commit_sha}")

    # Update branch ref
    gh_api(f"repos/{owner}/{repo}/git/refs/heads/{branch}", method="PATCH", payload={
        "sha": commit_sha,
        "force": True
    })
    print(f"Updated branch {branch} to {commit_sha}")

if __name__ == "__main__":
    main()
