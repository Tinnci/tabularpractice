/**
 * GitHub Editor Service
 * 用于通过 GitHub API 编辑题库文件
 * 
 * 设计原则：
 * 1. 复用现有的 githubToken (来自 useProgressStore)
 * 2. 需要额外的 repo 权限 (如果用户的 token 只有 gist scope，需要提示升级)
 * 3. 支持读取文件、更新文件、获取 commit 历史
 */

import { useProgressStore } from "@/lib/store";
import { DICT } from "@/lib/i18n";

interface GitHubFileContent {
    path: string;
    sha: string;
    content: string;  // Base64 encoded
    encoding: string;
    size: number;
    name: string;
}

interface UpdateFileResponse {
    content: {
        sha: string;
        path: string;
    };
    commit: {
        sha: string;
        message: string;
    };
}

interface RepoInfo {
    owner: string;
    repo: string;
    branch?: string;
}

class GitHubEditorService {
    /**
     * 获取当前存储的 GitHub Token
     * 复用 Gist 同步的 token
     */
    private getToken(): string | null {
        return useProgressStore.getState().githubToken;
    }

    private getHeaders(): HeadersInit {
        const token = this.getToken();
        if (!token) {
            throw new Error(DICT.github.noToken);
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * 检查 Token 是否具有 repo 权限
     * 通过尝试访问 user/repos 来验证
     */
    async checkRepoPermission(): Promise<{ hasPermission: boolean; error?: string }> {
        const token = this.getToken();
        if (!token) {
            return { hasPermission: false, error: DICT.github.noToken };
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return { hasPermission: false, error: DICT.github.tokenInvalid };
            }

            const scopes = response.headers.get('x-oauth-scopes') || '';
            const hasRepoScope = scopes.includes('repo') || scopes.includes('public_repo');

            if (!hasRepoScope) {
                return {
                    hasPermission: false,
                    error: DICT.github.missingRepoScope
                };
            }

            return { hasPermission: true };
        } catch (error) {
            return { hasPermission: false, error: String(error) };
        }
    }

    /**
     * Get specific permission level for a repository
     */
    async getRepoPermission(owner: string, repo: string): Promise<{
        permission: 'read' | 'write' | 'admin'
        isFork: boolean,
        parent?: { full_name: string, html_url: string }
    }> {
        const url = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(url, { headers: this.getHeaders() });

        if (!response.ok) {
            if (response.status === 404) return { permission: 'read', isFork: false }; // Private or not found, treat as read-only/inaccessible
            throw new Error(`Failed to fetch repo info: ${response.statusText}`);
        }

        const data = await response.json();

        let permission: 'read' | 'write' | 'admin' = 'read';
        if (data.permissions?.admin) permission = 'admin';
        else if (data.permissions?.push) permission = 'write';

        return {
            permission,
            isFork: data.fork,
            parent: data.parent
        };
    }

    /**
     * Fork a repository to the authenticated user's account
     */
    async forkRepo(owner: string, repo: string): Promise<{
        full_name: string;
        html_url: string;
        owner: { login: string };
    }> {
        const url = `https://api.github.com/repos/${owner}/${repo}/forks`;
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Fork failed");
        }

        return await response.json();
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
            if (response.status === 404) {
                throw new Error(`文件不存在: ${path}`);
            }
            throw new Error(error.message || `获取文件失败: ${response.status}`);
        }

        return response.json();
    }

    /**
     * 更新文件
     */
    async updateFile(
        owner: string,
        repo: string,
        path: string,
        content: string,
        message: string,
        sha: string,
        branch: string = 'main'
    ): Promise<UpdateFileResponse> {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        // Base64 encode the content (handle Unicode)
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
            if (response.status === 409) {
                throw new Error("文件已被其他人修改，请刷新后重试");
            }
            throw new Error(error.message || `更新文件失败: ${response.status}`);
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
    parseRepoUrl(url: string): RepoInfo | null {
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

    /**
     * 检查是否可以编辑 (有 token + 有 repo 权限)
     */
    canEdit(): boolean {
        return !!this.getToken();
    }
}

export const githubEditor = new GitHubEditorService();
export type { RepoInfo, GitHubFileContent, UpdateFileResponse };
