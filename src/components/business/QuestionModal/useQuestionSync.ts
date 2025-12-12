"use client";

import { useProgressStore } from "@/lib/store";
import { githubEditor } from "@/services/githubEditor";
import { Question } from "@/lib/types";
import { toast } from "sonner";
import { DICT } from "@/lib/i18n";

export interface UseQuestionSyncProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useQuestionSync({ onSuccess, onError }: UseQuestionSyncProps = {}) {
    const syncQuestion = async (question: Question, updatedQuestion: Partial<Question>) => {
        try {
            const { githubToken } = useProgressStore.getState();

            // 1. 检查是否有 GitHub token
            if (!githubToken) {
                toast.info(DICT.syncToast.savedLocally, {
                    description: DICT.syncToast.configureTokenDesc,
                });
                return { needsConfig: true };
            }

            // 2. 检查 token 权限
            const permissionCheck = await githubEditor.checkRepoPermission();
            if (!permissionCheck.hasPermission) {
                toast.warning(DICT.syncToast.tokenNoPermission, {
                    description: permissionCheck.error,
                });
                return { needsConfig: true };
            }

            // 3. 检查是否有源 URL
            if (!question.sourceUrl) {
                toast.error(DICT.syncToast.syncFailed, {
                    description: DICT.syncToast.noRepoInfo
                });
                return { needsConfig: true };
            }

            // 解析仓库信息
            const repoInfo = githubEditor.parseRepoUrl(question.sourceUrl);
            if (!repoInfo) {
                toast.error(DICT.syncToast.parseRepoFailed, {
                    description: `${DICT.syncToast.invalidRepoUrl}: ${question.sourceUrl}`
                });
                return { needsConfig: true };
            }

            // 构建文件路径
            const filePath = `data/questions/${question.paperId}/index.json`;

            // 合并 question 和 updatedQuestion 以确保有完整的 Question 对象
            const mergedQuestion: Question = {
                ...question,
                ...updatedQuestion
            };

            // 执行同步
            await toast.promise(
                (async () => {
                    // 获取现有文件
                    const fileContent = await githubEditor.getFile(
                        repoInfo.owner,
                        repoInfo.repo,
                        filePath,
                        repoInfo.branch
                    );

                    // 解码并解析 JSON
                    const decodedContent = githubEditor.decodeContent(fileContent.content);
                    const questions = JSON.parse(decodedContent) as Question[];

                    // 找到并更新题目
                    const index = questions.findIndex(q => q.id === mergedQuestion.id);
                    if (index === -1) {
                        throw new Error('在文件中找不到该题目');
                    }

                    // 合并更新（保留原有字段，覆盖修改的字段）
                    questions[index] = {
                        ...questions[index],
                        ...mergedQuestion
                    };

                    // 更新文件
                    const result = await githubEditor.updateFile(
                        repoInfo.owner,
                        repoInfo.repo,
                        filePath,
                        JSON.stringify(questions, null, 2),
                        `chore: 更新题目 ${mergedQuestion.id}`,
                        fileContent.sha,
                        repoInfo.branch || 'main'
                    );

                    return result;
                })(),
                {
                    loading: DICT.syncToast.syncing,
                    success: (result) => {
                        onSuccess?.();
                        return `${DICT.syncToast.syncSuccess} (${result.commit.sha.slice(0, 7)})`;
                    },
                    error: (error) => {
                        console.error('[QuestionSync] Sync failed:', error);
                        onError?.(error);
                        return `${DICT.syncToast.syncFailed}: ${error.message}`;
                    }
                }
            );

            return { success: true };
        } catch (error) {
            console.error('[QuestionSync] Error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(DICT.syncToast.saveFailed, {
                description: errorMessage
            });
            onError?.(error instanceof Error ? error : new Error(errorMessage));
            return { success: false, error: errorMessage };
        }
    };

    return { syncQuestion };
}
