/**
 * GitHub Editor Service
 * 用于通过 GitHub API 编辑题库文件
 */

interface GitHubFileContent {
    path: string;
    sha: string;
    content: string;  // Base64 encoded
    encoding: string;
}

interface UpdateFileParams {
    owner: string;
    repo: string;
    path: string;
    content: string;  // Raw content (will be base64 encoded)
    message: string;
    sha: string;  // Current file SHA for update
    branch?: string;
}

class GitHubEditorService {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    private getHeaders() {
        if (!this.token) {
            throw new Error("GitHub token not set. Please configure in settings.");
        }
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * 获取文件内容和 SHA
     */
    async getFile(owner: string, repo: string, path: string, branch?: string): Promise<GitHubFileContent> {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`;

        const response = await fetch(url, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to fetch file: ${response.status}`);
        }

        return response.json();
    }

    /**
     * 更新文件
     */
    async updateFile({
        owner,
        repo,
        path,
        content,
        message,
        sha,
        branch = 'main'
    }: UpdateFileParams): Promise<{ commit: { sha: string } }> {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        // Base64 encode the content
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                message,
                content: encodedContent,
                sha,
                branch,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to update file: ${response.status}`);
        }

        return response.json();
    }

    /**
     * 解析仓库 URL 获取 owner 和 repo
     * 支持格式:
     * - https://raw.githubusercontent.com/owner/repo/branch
     * - https://github.com/owner/repo
     * - owner/repo
     */
    parseRepoUrl(url: string): { owner: string; repo: string; branch?: string } | null {
        // raw.githubusercontent.com format
        const rawMatch = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)/);
        if (rawMatch) {
            return { owner: rawMatch[1], repo: rawMatch[2], branch: rawMatch[3] };
        }

        // github.com format
        const ghMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (ghMatch) {
            return { owner: ghMatch[1], repo: ghMatch[2].replace('.git', '') };
        }

        // owner/repo format
        const simpleMatch = url.match(/^([^/]+)\/([^/]+)$/);
        if (simpleMatch) {
            return { owner: simpleMatch[1], repo: simpleMatch[2] };
        }

        return null;
    }

    /**
     * Decode base64 file content
     */
    decodeContent(base64Content: string): string {
        return decodeURIComponent(escape(atob(base64Content)));
    }
}

export const githubEditor = new GitHubEditorService();
