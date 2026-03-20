import sys
import os
import json
import subprocess
import datetime
import requests

def run_git_command(args, cwd):
    result = subprocess.run(["git"] + args, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Git Error: {result.stderr}")
    return result

def deploy_app(app_id, github_token, repo_name, local_path):
    """
    Pushes code to GitHub to trigger Coolify deployment.
    """
    print(f"Deploying App {app_id} to GitHub repo {repo_name}...")
    
    # 1. Create GitHub Repo if it doesn't exist
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # Check if repo exists
    user_resp = requests.get("https://api.github.com/user", headers=headers)
    username = user_resp.json()["login"]
    
    repo_url = f"https://api.github.com/repos/{username}/{repo_name}"
    resp = requests.get(repo_url, headers=headers)
    
    if resp.status_code == 404:
        print(f"Creating repository {repo_name}...")
        create_resp = requests.post("https://api.github.com/user/repos", 
                                  headers=headers, 
                                  json={"name": repo_name, "private": True})
        if create_resp.status_code != 201:
            return {"status": "error", "message": f"Failed to create repo: {create_resp.text}"}
    
    # 2. Git Init and Push
    abs_local_path = os.path.abspath(local_path)
    if not os.path.exists(abs_local_path):
        return {"status": "error", "message": f"Local path {abs_local_path} not found."}

    run_git_command(["init"], abs_local_path)
    run_git_command(["add", "."], abs_local_path)
    run_git_command(["commit", "-m", "Genesis: Initial scaffold for Fern's Sanctuary"], abs_local_path)
    run_git_command(["branch", "-M", "main"], abs_local_path)
    
    # Remote setup
    remote_url = f"https://{github_token}@github.com/{username}/{repo_name}.git"
    run_git_command(["remote", "remove", "origin"], abs_local_path) # Clean up if exists
    run_git_command(["remote", "add", "origin", remote_url], abs_local_path)
    
    push_result = run_git_command(["push", "-u", "origin", "main", "--force"], abs_local_path)
    
    if push_result.returncode == 0:
        deployment_url = f"https://{repo_name}.soulgarden.us"
        return {
            "status": "success",
            "repo_url": f"https://github.com/{username}/{repo_name}",
            "deployment_url": deployment_url,
            "message": f"Code pushed to {repo_name}. Coolify should now pick up the build."
        }
    else:
        return {"status": "error", "message": f"Push failed: {push_result.stderr}"}

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python deploy_app.py <app_id> <github_token> <repo_name> <local_path>")
        sys.exit(1)
    
    app_id, github_token, repo_name, local_path = sys.argv[1:5]
    result = deploy_app(app_id, github_token, repo_name, local_path)
    print(json.dumps(result))
