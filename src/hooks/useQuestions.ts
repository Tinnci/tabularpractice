import useSWR from 'swr';
import { useProgressStore } from '@/lib/store';
import { Question } from '@/lib/types';

// 这是一个通用的 fetcher
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
});

export function useQuestions() {
    const repoBaseUrl = useProgressStore(state => state.repoBaseUrl);

    // 如果没配置远程 URL，默认使用本地 public/data (空字符串时)
    // 注意：Next.js 中访问 public 文件夹直接用 /data 即可
    const baseUrl = repoBaseUrl || '/data';

    const { data, error, isLoading } = useSWR<Question[]>(
        `${baseUrl}/index.json`,
        fetcher,
        {
            revalidateOnFocus: false, // 避免切窗口时频繁请求
            dedupingInterval: 60000,  // 1分钟内不重复请求
        }
    );

    return {
        questionsIndex: data || [],
        isLoading,
        isError: error
    };
}

export function usePaperDetail(paperId: string | null) {
    const repoBaseUrl = useProgressStore(state => state.repoBaseUrl);
    const baseUrl = repoBaseUrl || '/data';

    const { data, error, isLoading } = useSWR(
        paperId ? `${baseUrl}/papers/${paperId}.json` : null,
        fetcher,
        {
            revalidateOnFocus: false
        }
    );

    return {
        paperDetail: data,
        isLoading,
        isError: error
    };
}
