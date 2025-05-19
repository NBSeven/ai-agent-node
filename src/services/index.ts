import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const model = 'gpt-4o'
const modelo1 = "gpt-o1";

// 使用你自己的 Telegram Token
const token = '7812402354:AAHqfpWo_219_E4HU1iyR-29aeR0EVjKO_c';
const bot = new TelegramBot(token, { polling: true });

// 发送消息
const chatId = '-1002423693501'; // 你要发送消息的聊天 ID
// 格式化处理
const fixJsonString = (jsonString: string) => {
    const mapping: any = {
        False: "false",
        True: "true",
        None: "null",
        High: "high", // 替换为字符串 "high"
        Medium: "medium", // 替换为字符串 "medium"
        Low: "low", // 替换为字符串 "low"
        high: "high", // 替换为字符串 "high"
        medium: "medium", // 替换为字符串 "medium"
        low: "low", // 替换为字符串 "low"
        Yes: "Yes",
        No: "No",
    };
    // 使用正则替换映射表中的每个非标准值
    const regex = new RegExp(`\\b(${Object.keys(mapping).join("|")})\\b`, "g");
    return jsonString
        .replace(/^{{/, "{")
        .replace(/}}$/, "}")
        .replace(/[\n\r]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(regex, (match) => mapping[match]);
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟任务执行接口：返回任务 ID
async function startTask(path: string, taskPayload: any): Promise<string> {
    try {
        const response = await fetch(
            `https://myapp-258904095968.asia-east1.run.app/${path}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(taskPayload),
            }
        );
        const data = await response.json();
        // 如果startTask返回的taskid不存在就上报
        if (!data.task_id) {
            bot.sendMessage(chatId, path)
            bot.sendMessage(chatId, JSON.stringify(taskPayload))
            bot.sendMessage(chatId, JSON.stringify(data))
        }
        return data.task_id; // 假设任务 ID 存在于 data.taskId
    } catch (error: any) {
        console.log(error)
        console.log(path, JSON.stringify(taskPayload))
        bot.sendMessage(chatId, path)
        bot.sendMessage(chatId, error.toString())
        bot.sendMessage(chatId, JSON.stringify(taskPayload))

        throw new Error(`startTask: ${error.toString()},${taskPayload}`);
    }

}

// // 模拟任务状态查询接口：根据任务 ID 查询状态
// async function checkTaskStatus(task_id: string): Promise<any> {
//     const response = await fetch(
//         `https://myapp-258904095968.asia-east1.run.app/v1.3/task/${task_id}`
//     );
//     const data = await response.json();
//     return data; // 假设返回的 data 包含 { status: "pending" | "success" | "error", result: any }
// }
// 模拟任务状态查询接口：根据任务 ID 查询状态
export async function checkTaskStatus(task_id: string): Promise<any> {
    const retries = 20
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(
                `https://myapp-258904095968.asia-east1.run.app/v1.3/task/${task_id}`, {
                headers: { "Connection": 'keep-alive' },
            }
            );
            const data = await response.json();
            return data; // 假设返回的 data 包含 { status: "pending" | "success" | "error", result: any }
        } catch (error) {
            console.log(`请求失败，重试`, error);
            await new Promise(res => setTimeout(res, 2000)); // 2s 重试
        }
    }

    throw new Error("请求多次失败");

}


// 轮询任务状态，增加最大次数限制
async function waitForTaskCompletion(
    taskId: string,
    maxRetries = 10000000000000000,
    interval = 2000
): Promise<any> {
    let attempt = 0;
    while (attempt < maxRetries) {
        attempt++;
        const statusResponse = await checkTaskStatus(taskId);
        if (statusResponse.status === "success") {
            if (typeof statusResponse.data === "string") {
                if (/^\{.*\}$/.test(fixJsonString(statusResponse.data))) {
                    try {
                        return {
                            data: JSON.parse(fixJsonString(statusResponse.data)),
                            res: statusResponse,
                        }; // 任务成功，返回结果
                    } catch (error) {
                        console.log(fixJsonString(statusResponse.data));
                        console.log(error)
                        return error;
                    }
                } else {
                    return {
                        data: statusResponse.data,
                        res: statusResponse,
                    }; // 任务成功，返回结果
                }
            } else {
                return {
                    data: statusResponse.data,
                    res: statusResponse,
                }; // 任务成功，返回结果
            }
        } else if (statusResponse.status === "error") {
            console.error(`任务执行失败: ${taskId} ${statusResponse}`);
            throw new Error(`任务执行失败: ${taskId} ,${JSON.stringify(statusResponse)}`);
        } else if (statusResponse.status === "failed") {
            console.error(`Task failed:${statusResponse}`);
            throw new Error(`任务执行失败: ${taskId},${JSON.stringify(statusResponse)}`);
        }

        console.log(
            `任务 ${taskId} 第 ${attempt} 次轮询, 状态: ${statusResponse.status}`
        );
        await delay(interval); // 等待指定的间隔
    }

    // 超过最大轮询次数，抛出异常
    console.error(`任务 ${taskId} 超过最大轮询次数 (${maxRetries}), 未完成`);
    throw new Error(`任务 ${taskId} 超过最大轮询次数 (${maxRetries}), 未完成`);
}

// 3.1 arthur_1风格渲染
const renderText = async (data: any, twitter: string, type = 1) => {
    const map = new Map();
    // map.set(1, "3.1 arthur_1短文本/评论风格渲染");
    map.set(1, "3.2 InsiderFinance");
    map.set(2, "3.3 Jon Crabb");
    map.set(3, "3.4 0xANN");

    map.set(4, "4.1 InsiderFinance");
    map.set(5, "4.2 Jon Crabb");
    map.set(6, "4.3 0xANN");
    let text = "";
    if (typeof data === "string") {
        text = data;
    } else {
        text = data.justifications || "null";
    }
    //3.1 render
    // const render31Title =
    //   type === 1
    //     ? "3.2 arthur_1短文本/评论风格渲染"
    //     : "3.4 arthur_2长文本风格渲染";
    const render31Title = map.get(type);
    const render31Payload = {
        text,
        model: modelo1,
        type,
        twitter: twitter,
    };
    const render31Id = await startTask("/ai/2", render31Payload);
    const render31Result = await waitForTaskCompletion(render31Id);
    const render31Step = {
        title: render31Title,
        jsonData: render31Result.res,
        data: render31Result.data
    };
    return render31Step
};

// tavily search
const tavilySearch = async (title: string, text: string) => {
    const searchTitle = title;
    const searchPayload = {
        text,
        model,
    };
    const searchId = await startTask("/ai/tavily/search", searchPayload);
    const searchResult = await waitForTaskCompletion(searchId);
    const searchStep = {
        title: searchTitle,
        jsonData: searchResult.res,
    };
    return searchResult;
};


const taskFun = async (title: string, route: string, params: any) => {
    const payload = {
        model,
        ...params,
    };
    const taskId = await startTask(route, payload);
    const taskResult = await waitForTaskCompletion(taskId);
    const taskStep = {
        title,
        jsonData: taskResult.res,
    };
    return taskResult;
};

function getRandom(...args: number[]) {
    return args[Math.floor(Math.random() * args.length)];
}

function extractUrls(text: string) {
    // 正则表达式匹配以 http/https 开头，直到遇到空格、逗号或字符串结束
    const urlRegex = /https?:\/\/[^\s,]+/gi;
    return text.match(urlRegex) || [];
}

async function resolveShortUrls(content: string): Promise<string[]> {
    // 1. 提取 URL
    const matches = extractUrls(content) || [];
    const uniqueUrls = [...new Set(matches)];
    // 配置参数
    const TIMEOUT = 5000;
    // 2. 并发解析
    const resolvedUrls = await Promise.all(
        uniqueUrls.map(async (url) => {
            const cleanUrl = url.replace(/[.,;!?]+$/, '');
            try {
                // const response = await fetch(`${cleanUrl}`, {
                //     headers: {
                //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                //         'Accept-Language': 'en-US,en;q=0.9',
                //     },
                // });
                // if (!response.ok) throw new Error('解析失败');
                // const { resolvedUrl } = await response.json();
                // return resolvedUrl;
                const response = await axios.get(url, {
                    maxRedirects: 0,       // 禁止自动重定向
                    validateStatus: null,   // 允许所有状态码
                    timeout: TIMEOUT,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                });
                // 解析重定向地址
                if ([301, 302, 307, 308].includes(response.status)) {
                    const redirectUrl = response.headers.location;
                    return redirectUrl;
                }

                // 无重定向的直接返回
                return url;
            } catch (error) {
                console.error(`解析失败: ${cleanUrl}`, error);
                return cleanUrl; // 返回原始链接作为 fallback
            }
        })
    );
    return resolvedUrls
}

function safeConvert(str: string) {
    // 验证格式：可选符号开头、千分位数字、可选小数部分
    if (!/^[-+]?(\d{1,3}(,\d{3})*(\.\d+)?|\.\d+)$/.test(str)) return Number(str);
    return Number(str.replace(/,/g, ''));
}

export const handleAddStep = async (inputValue: string, type = 1, username = '') => {
    if (!inputValue) {
        return "请输入描述内容";
    }

    try {
        // 1.1 多语言处理
        const param111 = {
            text: inputValue,
            model,
        };

        const task02Result = await taskFun(
            "02 垃圾信息筛查",
            "/ai/0/2",
            param111
        );
        //垃圾信息筛查结果
        if (
            task02Result.data.is_spam_or_ad === "true" ||
            task02Result.data.is_spam_or_ad === true
        ) {
            return "";
        }
        const task110Result = await taskFun(
            "1.1.0 用户输入安全性审查",
            "/ai/1/1/0",
            param111
        );
        console.log(task110Result, "task110Result");
        //如果返回为True，结束流程
        if (
            task110Result.data["prompt injection attack detected"] === "true" ||
            task110Result.data["prompt injection attack detected"] === true
        ) {
            return false;
        }


        const task111Result = await taskFun(
            "1.1.1用户输入和背景信息整合",
            "/ai/1/1/1",
            param111
        );
        const task1Title = "1.1.2翻译";
        const task1Payload = {
            text: task111Result.data.combined_input,
            model,
        }; //
        const task1Id = await startTask("/ai/1/1/2", task1Payload);
        const task1Result = await waitForTaskCompletion(task1Id);
        const task1Step = {
            title: task1Title, // 动态生成标题
            jsonData: task1Result.res,
            input: task1Payload,
        };

        const param113 = {
            model,
            query: task1Result.data.topic,
            type: "1", // 1 短推 2 长推
            user_name: username,
        };

        const task113Result = await taskFun(
            "1.1.3查询用户历史交互记忆",
            "/ai/query_memory",
            param113
        );

        const param114 = {
            model,
            topic: task1Result.data.topic
        };
        const task114Result = await taskFun(
            "1.1.4筛选信息",
            "/ai/1/1/4",
            param114
        );
        // 类别判断加入前置搜索
        const task121Title = "1.2.1类别判断加入前置搜索";
        const task121Payload = {
            text: task114Result.data.summary,
            model,
        };
        const task121Id = await startTask("/ai/tavily/search", task121Payload);
        const task121Result = await waitForTaskCompletion(task121Id);
        const task121Step = {
            title: task121Title, // 动态生成标题
            jsonData: task121Result.res,
            input: task121Payload,
        };

        //1.2 类型判别
        const task2Title = "1.2 类型判别";
        const task2Payload = {
            topic: task1Result.data.topic,
            model,
            search: JSON.stringify(task121Result.data.results),
        };
        const task2Id = await startTask("/ai/1/2/2", task2Payload);
        const task2Result = await waitForTaskCompletion(task2Id);
        const task2Step = {
            title: task2Title, // 动态生成标题
            jsonData: task2Result.res,
            input: task2Payload,
        };

        // 1.3 非预测市场话题回复生成
        if (task2Result.data.valuable === false) {
            // const task3Title = "1.3.1，使用 tavily 搜索前 10 条内容";
            // const task3Payload = {
            //   text: task1Result.data.topic,
            //   model,
            // };
            // const task3Id = await startTask("/ai/tavily/search", task3Payload);
            // const task3Result = await waitForTaskCompletion(task3Id);
            // const task3Step = {
            //   title: task3Title, // 动态生成标题
            //   jsonData: task3Result.res,
            // };
            // 
            // 1.3.1 非预测市场话题回复生成
            const task4Title = "1.3.1 非预测市场话题回复生成";
            const task4Payload = {
                topic: task1Result.data.topic,
                model,
                memory: JSON.stringify(task113Result.data),
                result: JSON.stringify(task121Result.data.results),
            };
            const task4Id = await startTask("/ai/1/3/1", task4Payload);
            const task4Result = await waitForTaskCompletion(task4Id);
            const task4Step = {
                title: task4Title, // 动态生成标题
                jsonData: task4Result.res,
                input: task4Payload,
            };

            const pushMemoryParams = {
                model,
                query: JSON.stringify(task1Result.data.topic),
                reply: task4Result.data.response.long_reply,
                type: "1",
                user_name: username,
            };
            const memoryResult = await taskFun(
                "3.记忆储存",
                "/ai/push_memory",
                pushMemoryParams
            );
            console.log(memoryResult)
            // 返回结果
            return {
                result: task4Step
            }
        } else {
            // 1.4 类预测市场话题回复生成
            const task5Title =
                "1.4 类预测市场话题回复生成，1.4.1 预测市场话题回复生成，使用 tavily 搜索前 10 条内容";
            const task5Payload = {
                text:
                    task2Result.data.selected_topic || task2Result.data.seleted_topic,
                model,
            };
            const task5Id = await startTask("/ai/tavily/search", task5Payload);
            const task5Result = await waitForTaskCompletion(task5Id);
            const task5Step = {
                title: task5Title,
                jsonData: task5Result.res,
                input: task5Payload,
            };

            // 1.4.2 第一次判别 1.4.2.1 识别实体
            const task6Title = "1.4.2.1 识别实体";
            const task6Payload = {
                topic:
                    task2Result.data.selected_topic || task2Result.data.seleted_topic,
                model,
            };
            const task6Id = await startTask("/ai/1/4/2/1", task6Payload);
            const task6Result = await waitForTaskCompletion(task6Id);
            const task6Step = {
                title: task6Title,
                jsonData: task6Result.res,
                input: task6Payload,
            };

            // 1.4.2.2 识别实体后搜索，使用 tavily 搜索前 10 条内容
            const task1422Title =
                "1.4.2.2 识别实体后搜索，使用 tavily 搜索前 10 条内容";
            const task1422Payload = {
                text: JSON.stringify(task6Result.data),
                model,
            };
            const task1422Id = await startTask(
                "/ai/tavily/search",
                task1422Payload
            );
            const task1422Result = await waitForTaskCompletion(task1422Id);
            const task1422Step = {
                title: task1422Title,
                jsonData: task1422Result.res,
                input: task1422Payload,
            };

            //1.4.2.3 实体虚构判断
            const task7Title = " 1.4.2.3 实体虚构判断";

            const task7Payload = {
                // entities: JSON.stringify(task6Result.data.entities),
                entities: JSON.stringify(
                    task6Result.data.suspected_fictional_entities
                ),
                search: JSON.stringify(task5Result.data.results), //{1.4.1的搜索结果}，
                model,
                result: JSON.stringify(task1422Result.data.results), //{1.4.2.2实体搜索结果}
            };
            const task7Id = await startTask("/ai/1/4/2/3", task7Payload);
            const task7Result = await waitForTaskCompletion(task7Id);
            const task7Step = {
                title: task7Title,
                jsonData: task7Result.res,
                input: task7Payload,
            };

            // 如果 JSON 中的 “if_contains” 为 No，则继续后续流程
            if (task7Result.data.if_contains === "No") {
                //1.4.3  第一次问题优化
                const task8Title = " 1.4.3.1第一次问题优化";
                const task8Payload = {
                    topic:
                        task2Result.data.selected_topic ||
                        task2Result.data.seleted_topic,
                    search: JSON.stringify(task5Result.data.results),
                    model,
                };
                const task8Id = await startTask("/ai/1/4/3/1", task8Payload);
                const task8Result = await waitForTaskCompletion(task8Id);
                const task8Step = {
                    title: task8Title,
                    jsonData: task8Result.res,
                    input: task8Payload,
                };
                //1.4.3.2差异过大话题判断逻辑
                // const param1431 = {
                //   result: JSON.stringify(task8Result.data.topic),
                //   topic: task1Result.data.topic,
                // };
                // const task1431Result = await taskFun(
                //   "1.4.3.2差异过大话题判断逻辑",
                //   "/ai/analysis/diff",
                //   param1431
                // );
                // - 如果 JSON 结果中 “verdict” 为 “Not Divergent”，则继续后续步骤
                // - 如果 JSON 结果中 “verdict” 为 “Overly Divergent”， 则跳转1.3.1
                // if (task1431Result.data["verdict"] === "Overly Divergent") {
                //   // 1.3.1 非预测市场话题回复生成
                //   const task4Title = "1.3.1 非预测市场话题回复生成";
                //   const task4Payload = {
                //     topic: task1Result.data.topic,
                //     model,
                //     search: JSON.stringify(task121Result.data.results),
                //   };
                //   const task4Id = await startTask("/ai/reply/simple", task4Payload);
                //   const task4Result = await waitForTaskCompletion(task4Id);
                //   const task4Step = {
                //     title: task4Title, // 动态生成标题
                //     jsonData: task4Result.res,
                //     input: task4Payload,
                //   };

                //   setLoading(false);
                //   return;
                // }
                //1.4.4 关键词生成
                const task11Title = "1.4.4 关键词生成";
                const task11Payload = {
                    topic: task8Result.data.topic,
                    model,
                };
                const task11Id = await startTask(
                    "/ai/1/4/4",
                    task11Payload
                );
                const task11Result = await waitForTaskCompletion(task11Id);
                const task11Step = {
                    title: task11Title,
                    jsonData: task11Result.res,
                    input: task11Payload,
                };


                //1.4.5 第二次搜索
                const keys1 = task11Result.data.keys1 || [];
                const keys2 = task11Result.data.keys2 || [];
                const searchRes: any[] = [];
                if (keys1.length > 0) {
                    const keys1res: any = await tavilySearch(
                        "1.4.5.1 第二次搜索keys1",
                        JSON.stringify(keys1)
                    );

                    keys1res.data.results.forEach((item: any) => {
                        searchRes.push(item);
                    });
                }
                if (keys2.length > 0) {
                    const keys2res: any = await tavilySearch(
                        "1.4.5.1 第二次搜索keys2",
                        JSON.stringify(keys2)
                    );
                    keys2res.data.results.forEach((item: any) => {
                        searchRes.push(item);
                    });
                }
                const dateres: any = await tavilySearch(
                    "1.4.5.2 时间的不确定性进行搜索",
                    JSON.stringify(task8Result.data.date_question)
                );

                //1.4.6 二次问题优化
                const task12Title = "1.4.6 二次问题优化";
                const task12Payload = {
                    result1: JSON.stringify(searchRes),
                    result2: JSON.stringify(dateres.data.results),
                    // log: JSON.stringify(task8Result.data.log),
                    model,
                    topic:
                        task2Result.data.selected_topic ||
                        task2Result.data.seleted_topic,
                };

                const task12Id = await startTask(
                    "/ai/1/4/6",
                    task12Payload
                );

                const task12Result = await waitForTaskCompletion(task12Id);
                const task12Step = {
                    title: task12Title,
                    jsonData: task12Result.res,
                    input: task12Payload,
                };


                //1.4.7 二次问题优化后的第三次搜索

                const dateres147: any = await tavilySearch(
                    "1.4.7 二次问题优化后的第三次搜索",
                    // JSON.stringify(task12Result.res)
                    JSON.stringify(task12Result.data.revised_topic)
                );
                //1.4.8 事实判断
                const task13Title = "1.4.8 事实判断";
                const task13Payload = {
                    search: JSON.stringify(dateres147.data.results),
                    model,
                    topic:
                        task2Result.data.selected_topic ||
                        task2Result.data.seleted_topic,
                };

                const task13Id = await startTask(
                    "/ai/1/4/8/1",
                    task13Payload
                );

                const task13Result = await waitForTaskCompletion(task13Id);
                const task13Step = {
                    title: task13Title,
                    jsonData: task13Result.res,
                    input: task13Payload,
                };

                //1.4.8.1 第二次审查
                const param1481 = {
                    search_result: JSON.stringify(dateres147.data.results),
                    optimize_result: JSON.stringify(task12Result.data),
                    judge_result: JSON.stringify(task13Result.data),
                };
                const task1481Result = await taskFun(
                    "1.4.8.2 第二次审查",
                    "/ai/1/4/8/2",
                    param1481
                );

                const { evaluation_1, evaluation_2, evaluation_3 } =
                    task1481Result.data;

                // - 根据上面的 JSON 结果中的 “evaluation_1” , “evaluation_2” 和 “evaluation_3” 进行判断：
                // - 其中有一个为 "Yes" 或者都为 "Yes" 则跳转1.5.2
                // - 都为 "No" 则输出 "justification" 并跳转1.4.8
                if (
                    evaluation_1 === "Yes" ||
                    evaluation_2 === "Yes" ||
                    evaluation_3 === "Yes"
                ) {
                    //1.5.2 对于事实的回复
                    const task14Title = "1.5.2 对于事实的回复";
                    const task14Payload = {
                        text: task1Result.data.topic,
                        model,
                        topic:
                            task2Result.data.selected_topic ||
                            task2Result.data.seleted_topic,
                        result: JSON.stringify(task13Result.data),
                    };
                    const task14Id = await startTask("/ai/1/5/2", task14Payload);
                    const task14Result = await waitForTaskCompletion(task14Id);
                    const task14Step = {
                        title: task14Title,
                        jsonData: task14Result.res,
                        input: task14Payload,
                    };
                    //返回结果
                    const pushMemoryParams = {
                        model,
                        query: JSON.stringify(task1Result.data.topic),
                        reply: JSON.stringify(task14Result.data),
                        type: "1",
                        user_name: username,
                    };
                    const memoryResult = await taskFun(
                        "3.记忆储存",
                        "/ai/push_memory",
                        pushMemoryParams
                    );
                    console.log(memoryResult);
                    return {
                        result: task14Step
                    }
                } else {
                    //1.4.9使用向量数据库增强
                    // 1.4.9.1 查询Rootdata数据库
                    // "[\"Pendle\",\"Boros\"]" 单个查询
                    // const param1491 = {
                    //   entity: JSON.stringify(task6Result.data.entities),
                    //   model,
                    // };
                    // const task1491Result = await taskFun(
                    //   "1.4.9.1 查询Rootdata数据库",
                    //   "/ai/web3/extract",
                    //   param1491
                    // );
                    const taskList1491 = task6Result.data.entities.map(
                        (entity: string) => {
                            const param = {
                                entity,
                                model,
                            };
                            return taskFun(
                                `1.4.9.1 查询Rootdata数据库${entity}`,
                                "/ai/1/4/9/1",
                                param
                            );
                        }
                    );
                    const taskList1491Result: any = [];
                    await (async () => {
                        try {
                            for await (const item of taskList1491) {
                                console.log(item, "1.4.9.1 查询Rootdata数据库 item push");

                                taskList1491Result.push(item.data);
                            }
                        } catch (error) {
                            console.error("Error:", error);
                        }
                    })();
                    // 1.4.9.2 提取web3相关问题
                    const param1492 = {
                        topic: task12Result.data.revised_topic,
                        search: JSON.stringify(dateres147.data.results),
                        model,
                    };
                    const task1492Result = await taskFun(
                        "1.4.9.2 提取web3相关问题",
                        "/ai/1/4/9/2",
                        param1492
                    );
                    debugger;
                    const taskList1493Result: any = [];
                    const { keywords } = task1492Result.data;
                    const taskList1493Keywords = keywords.map((topic: string) => {
                        const param = {
                            topic,
                            model,
                        };
                        return taskFun(
                            `1.4.9.3查询News api keywords:${topic}`,
                            "/ai/1/4/9/3",
                            param
                        );
                    });
                    await (async () => {
                        try {
                            for await (const item of taskList1493Keywords) {
                                console.log(item, "1.4.9.3查询News api keywords item push");

                                taskList1493Result.push(item.data);
                            }
                        } catch (error) {
                            console.error("Error:", error);
                        }
                    })();

                    debugger;
                    //  1.4.9.3查询News api
                    // const param1493 = {
                    //   topic: JSON.stringify(task1492Result.data.topicQuestions),
                    //   model,
                    // };
                    // const task1493Result = await taskFun(
                    //   " 1.4.9.3查询News api",
                    //   "/ai/web3/dictionary",
                    //   param1493
                    // );
                    const param1491 = {
                        query: JSON.stringify(task12Result.data.revised_topic),
                        model,
                        user_name: username,
                        type: '1'
                    }
                    const task1491Result = await taskFun(
                        "1.4.9.4 查询历史长短推记忆",
                        "/ai/query_memory",
                        param1491
                    );
                    //1.4.10 生成长文
                    const task14Title = "1.4.10 生成长文";
                    const task14Payload = {
                        text: task1Result.data.topic, // 原始推特信息
                        model,
                        memory: JSON.stringify(task1491Result.data),
                        roodata_result: JSON.stringify(taskList1491Result), //1.4.9.1 查询Rootdata数据库的结果
                        news_result: JSON.stringify(taskList1493Result), //1.4.9.3查询News api的结果
                        optimize_result: JSON.stringify(task12Result.data), //1.4.6 第二次优化结果中的 “revised_topic” 和 "revised_date"
                        search_result: JSON.stringify(dateres147.data.results), // 1.4.7第三次搜索结果
                    };
                    const task14Id = await startTask(
                        "/ai/1/4/10",
                        task14Payload
                    );
                    const task14Result = await waitForTaskCompletion(task14Id);
                    const task14Step = {
                        title: task14Title,
                        jsonData: task14Result.res,
                        input: task14Payload,
                    };

                    // 1.4.11 总结长文为回复
                    const param14911 = {
                        text: task1Result.data.topic,
                        result: JSON.stringify(task14Result.data),
                        optimize_result: JSON.stringify(task12Result.data),
                        model,
                    };
                    const task14911Result = await taskFun(
                        "1.4.11 总结长文为回复",
                        "/ai/1/4/11",
                        param14911
                    );


                    let rt = await renderText(task14911Result.data, inputValue, type);

                    const pushMemoryParams = {
                        model,
                        query: JSON.stringify(task1Result.data.topic),
                        reply: JSON.stringify(rt.data),
                        type: "1",
                        user_name: username,
                    };
                    const memoryResult = await taskFun(
                        "3.记忆储存",
                        "/ai/push_memory",
                        pushMemoryParams
                    );
                    console.log(memoryResult);
                    ////返回结果
                    return {
                        result: rt
                    }
                }
            } else {
                // 1.5 非常规情况的回复
                // 对于1.4.2虚构判断后，输出Json的if_contains为Yes的情况进行回复
                //1.5.1 虚构判断后为虚构/模糊的回复
                const task16Title = "1.5.1 虚构判断后为虚构/模糊的回复";
                const task16Payload = {
                    text: task1Result.data.topic,
                    topic:
                        task2Result.data.selected_topic || task2Result.data.seleted_topic,
                    result: JSON.stringify(task7Result.data),
                    model,
                };
                const task16Id = await startTask("/ai/reply/fiction", task16Payload);
                const task16Result = await waitForTaskCompletion(task16Id);
                const task16Step = {
                    title: task16Title,
                    jsonData: task16Result.res,
                    input: task16Payload,
                };
                let rt1 = await renderText(task16Result.data, inputValue);
                const pushMemoryParams = {
                    model,
                    query: JSON.stringify(task1Result.data.topic),
                    reply: JSON.stringify(rt1.data),
                    type: "1",
                    user_name: username,
                };
                const memoryResult = await taskFun(
                    "3.记忆储存",
                    "/ai/push_memory",
                    pushMemoryParams
                );
                console.log(memoryResult);
                console.log(rt1, '渲染完成')
                return {
                    result: rt1
                }
            }

        }
    } catch (error: any) {

        console.error(error);
        bot.sendMessage(chatId, error.toString())
            .then(() => {
                console.log('Message sent successfully');
            })
            .catch((error: any) => {
                console.error('Error sending message:', error);
            });
        return {
            error: error.toString()
        }
    }
};

export const handleAddStepL = async (inputValue: string, type = 1) => {
    if (!inputValue) {
        return "请输入描述内容";
    }
    try {
        // 1.1 多语言处理
        const param111 = {
            text: inputValue,
            model,
        };
        const task111Result = await taskFun(
            "1.1.1原始语言搜索",
            "/ai/tavily/search",
            param111
        );
        const task1Title = "1.1.2翻译";
        const task1Payload = {
            text: inputValue,
            model,
            search: JSON.stringify(task111Result.data.results),
        }; //
        const task1Id = await startTask("ai/translate", task1Payload);
        const task1Result = await waitForTaskCompletion(task1Id);
        const task1Step = {
            title: task1Title, // 动态生成标题
            jsonData: task1Result.res,
        };

        // 类别判断加入前置搜索
        const task121Title = "类别判断加入前置搜索";
        const task121Payload = {
            text: task1Result.data.topic,
            model,
        };
        const task121Id = await startTask("/ai/tavily/search", task121Payload);
        const task121Result = await waitForTaskCompletion(task121Id);
        const task121Step = {
            title: task121Title, // 动态生成标题
            jsonData: task121Result.res,
        };

        //1.2 类型判别
        const task2Title = "1.2 类型判别";
        const task2Payload = {
            topic: task1Result.data.topic,
            model,
            search: JSON.stringify(task121Result.data.results),
        };
        const task2Id = await startTask("/ai/predict", task2Payload);
        const task2Result = await waitForTaskCompletion(task2Id);
        const task2Step = {
            title: task2Title, // 动态生成标题
            jsonData: task2Result.res,
        };

        // 1.3 非预测市场话题回复生成
        if (task2Result.data.valuable === false) {
            // return false;
            return {
                result: '拒绝执行'
            }
        } else {
            // 1.4 类预测市场话题回复生成
            const task5Title =
                "1.4 类预测市场话题回复生成，1.4.1 预测市场话题回复生成，使用 tavily 搜索前 10 条内容";
            const task5Payload = {
                text:
                    task2Result.data.selected_topic || task2Result.data.seleted_topic,
                model,
            };
            const task5Id = await startTask("/ai/tavily/search", task5Payload);
            const task5Result = await waitForTaskCompletion(task5Id);
            const task5Step = {
                title: task5Title,
                jsonData: task5Result.res,
            };

            // 1.4.2 第一次判别 1.4.2.1 识别实体
            const task6Title = "1.4.2.1 识别实体";
            const task6Payload = {
                topic:
                    task2Result.data.selected_topic || task2Result.data.seleted_topic,
                search: JSON.stringify(task5Result.data.results),
                model,
            };
            const task6Id = await startTask("/ai/prompt/1421", task6Payload);
            const task6Result = await waitForTaskCompletion(task6Id);
            const task6Step = {
                title: task6Title,
                jsonData: task6Result.res,
            };

            // 1.4.2.2 识别实体后搜索，使用 tavily 搜索前 10 条内容
            const task1422Title =
                "1.4.2.2 识别实体后搜索，使用 tavily 搜索前 10 条内容";
            const task1422Payload = {
                text: JSON.stringify(task6Result.data),
                model,
            };
            const task1422Id = await startTask(
                "/ai/tavily/search",
                task1422Payload
            );
            const task1422Result = await waitForTaskCompletion(task1422Id);
            const task1422Step = {
                title: task1422Title,
                jsonData: task1422Result.res,
            };

            //1.4.2.3 实体虚构判断
            const task7Title = " 1.4.2.3 实体虚构判断";
            const task7Payload = {
                // entities: JSON.stringify(task6Result.data.entities),
                entities: JSON.stringify(
                    task6Result.data.suspected_fictional_entities
                ),
                search: JSON.stringify(task5Result.data.results),//{1.4.1的搜索结果}，
                result: JSON.stringify(task1422Result.data.results),//{1.4.2.2实体搜索结果}
                model,
            };
            const task7Id = await startTask("/ai/prompt/1422", task7Payload);
            const task7Result = await waitForTaskCompletion(task7Id);
            const task7Step = {
                title: task7Title,
                jsonData: task7Result.res,
            };

            // 如果 JSON 中的 “if_contains” 为 No，则继续后续流程
            if (task7Result.data.if_contains === "No") {
                //1.4.3  第一次问题优化
                const task8Title = " 1.4.3第一次问题优化";
                const task8Payload = {
                    topic:
                        task2Result.data.selected_topic || task2Result.data.seleted_topic,
                    search: JSON.stringify(task5Result.data.results),
                    model,
                };
                const task8Id = await startTask("/ai/reply/optimize", task8Payload);
                const task8Result = await waitForTaskCompletion(task8Id);
                const task8Step = {
                    title: task8Title,
                    jsonData: task8Result.res,
                };
                //1.4.4 关键词生成

                const task11Title = "1.4.4 关键词生成";
                const task11Payload = {
                    topic: task8Result.data.topic,
                    model,
                };
                const task11Id = await startTask("/ai/tavily/related", task11Payload);
                const task11Result = await waitForTaskCompletion(task11Id);
                const task11Step = {
                    title: task11Title,
                    jsonData: task11Result.res,
                };


                //1.4.5 第二次搜索
                const keys1 = task11Result.data.keys1 || [];
                const keys2 = task11Result.data.keys2 || [];
                const searchRes: any[] = [];
                if (keys1.length > 0) {
                    const keys1res: any = await tavilySearch(
                        "1.4.5.1 第二次搜索keys1",
                        JSON.stringify(keys1)
                    );

                    keys1res.data.results.forEach((item: any) => {
                        searchRes.push(item);
                    });
                }
                if (keys2.length > 0) {
                    const keys2res: any = await tavilySearch(
                        "1.4.5.1 第二次搜索keys2",
                        JSON.stringify(keys2)
                    );
                    keys2res.data.results.forEach((item: any) => {
                        searchRes.push(item);
                    });
                }
                const dateres: any = await tavilySearch(
                    "1.4.5.2 时间的不确定性进行搜索",
                    JSON.stringify(task8Result.data.date_question)
                );

                //1.4.6 二次问题优化
                const task12Title = "1.4.6 二次问题优化";
                const task12Payload = {
                    result1: JSON.stringify(searchRes),
                    result2: JSON.stringify(dateres.data.results),
                    model,
                    // log: JSON.stringify(task8Result.data.log),
                    topic:
                        task2Result.data.selected_topic || task2Result.data.seleted_topic,
                };

                const task12Id = await startTask(
                    "/ai/reply/optimize/second",
                    task12Payload
                );

                const task12Result = await waitForTaskCompletion(task12Id);
                const task12Step = {
                    title: task12Title,
                    jsonData: task12Result.res,
                };


                //1.4.7 二次问题优化后的第三次搜索
                const dateres147: any = await tavilySearch(
                    "1.4.7 二次问题优化后的第三次搜索",
                    // JSON.stringify(task12Result.res)
                    JSON.stringify(task12Result.data.revised_topic)
                );

                //1.4.8 事实判断
                const task13Title = "1.4.8 事实判断";
                const task13Payload = {
                    search: JSON.stringify(dateres147.data.results),
                    model,
                    topic:
                        task2Result.data.selected_topic || task2Result.data.seleted_topic,
                };

                const task13Id = await startTask(
                    "/ai/tavily/probability",
                    task13Payload
                );

                const task13Result = await waitForTaskCompletion(task13Id);
                const task13Step = {
                    title: task13Title,
                    jsonData: task13Result.res,
                };

                const { evaluation_1, evaluation_2, evaluation_3 } =
                    task13Result.data;

                // - 根据上面的 JSON 结果中的 “evaluation_1” , “evaluation_2” 和 “evaluation_3” 进行判断：
                // - 其中有一个为 "Yes" 或者都为 "Yes" 则跳转1.5.3
                // - 都为 "No" 则输出 "justification" 并跳转1.4.8
                if (
                    evaluation_1 === "Yes" ||
                    evaluation_2 === "Yes" ||
                    evaluation_3 === "Yes"
                ) {
                    // return false;
                    return {
                        result: '拒绝执行'
                    }
                } else {
                    const task14Title = "2.4.9 回复生成";
                    const task14Payload = {
                        topic: task8Result.data.topic,
                        text: task1Result.data.topic,
                        model,
                        search: JSON.stringify(task13Result.data),
                    };
                    const task14Id = await startTask("/ai/tweet/reply", task14Payload);
                    const task14Result = await waitForTaskCompletion(task14Id);
                    const task14Step = {
                        title: task14Title,
                        jsonData: task14Result.res,
                    };

                    let rt = await renderText(task14Result.data, inputValue, type);

                    ////返回结果
                    return {
                        result: rt
                    }
                }
            } else {
                // return false;
                return {
                    result: '拒绝执行'
                }
            }
        }
    } catch (error: any) {
        console.error(error);

        bot.sendMessage(chatId, error.toString())
            .then(() => {
                console.log('Message sent successfully');
            })
            .catch((error: any) => {
                console.error('Error sending message:', error);
            });
        return {
            error: error.toString()
        }
    }
};

export const handleAddStepLN = async (inputValue: string, username = '') => {

    if (!inputValue) {
        return "请输入title";
    }
    if (!username) {
        return "请输入username";
    }
    // 获取polymarket相关的url
    let includeUrl = false;
    let purl = "";
    // 第一遍解析，因为推特的短链返回的可能还是一个短链
    const urls1 = await resolveShortUrls(inputValue);
    const urls1R = urls1.join(',')
    const urls = await resolveShortUrls(urls1R);
    const furls = urls.filter((url) =>
        url.includes("https://polymarket.com/event")
    );
    console.log(furls, 'furlsfurlsfurlsfurls')
    if (furls.length > 0) {
        includeUrl = true;
        purl = furls[0]; //只获取一个
    }
    try {

        const param0 = {
            text: inputValue,
            model,
        };

        const task0Result = await taskFun(
            "0 提炼title",
            "/generate_tweet/0",
            param0
        );
        const param11 = {
            text: task0Result.data.title, // 提炼的title,
            model,
        };
        const task11Result = await taskFun(
            "1.1 第一次搜索（为翻译提供信息）",
            "/ai/tavily/search",
            param11
        );
        //1.2 翻译
        const task2Title = "1.2 翻译";
        const task2Payload = {
            search: JSON.stringify(task11Result.data.results),
            model,
            summary: task0Result.data["detailed content"],
            title: task0Result.data.title,
        };
        const task2Id = await startTask("/generate_tweet/1/2", task2Payload);
        const task2Result = await waitForTaskCompletion(task2Id);
        const task2Step = {
            title: task2Title, // 动态生成标题
            jsonData: task2Result.res,
            input: task2Payload,
        };

        //1.3判断是否包含预测市场话题
        const param13 = {
            summary: task2Result.data["detailed content"],
            title: task2Result.data.title,
            model,
        };
        //"containsPredictionMarketTopic": "True or False", "predictionMarketTopic": "If containsPredictionMarketTopic is True, extract the prediction market topic from the input. If containsPredictionMarketTopic is False, return None."
        //如果{1.3的包含预测市场判断结果}为False，进入2.2，否则进入2.2.1
        //task13Result.data.containsPredictionMarketTopic,predictionMarketTopic
        const task13Result = await taskFun(
            "1.3判断是否包含预测市场话题",
            "/generate_tweet/1/3",
            param13
        );
        //2.1
        const task21Title = "第二次搜索（英文搜索内容，支持话题提取）";
        const task21Payload = {
            text: task2Result.data.title,
            model,
        };
        const task21Id = await startTask("/ai/tavily/search", task21Payload);
        const task21Result = await waitForTaskCompletion(task21Id);
        const task21Step = {
            title: task21Title, // 动态生成标题
            jsonData: task21Result.res,
            input: task21Payload,
        };
        let task24Result = null;
        if (task13Result.data.containsPredictionMarketTopic === "false") {
            //2.2提取话题
            const task22Title = "提取话题";
            const task22Payload = {
                summary: task2Result.data["detailed content"],
                title: task2Result.data.title,
                model,
                search: JSON.stringify(task21Result.data.results),
                // topic: task2Result.data.title,
            };
            const task22Id = await startTask(
                "/generate_tweet/2/2",
                task22Payload
            );
            const task22Result = await waitForTaskCompletion(task22Id);
            const task22Step = {
                title: task22Title, // 动态生成标题
                jsonData: task22Result.res,
                input: task22Payload,
            };

            //2.3  话题评估
            const param23 = {
                reason: JSON.stringify(task22Result.data.topics),
                summary: task2Result.data["detailed content"],
                title: task2Result.data.title,
            };
            const task23Result = await taskFun(
                "2.3提取话题",
                "/generate_tweet/2/3",
                param23
            );
            //2.4  话题评估
            const param24 = {
                evaluation: JSON.stringify(task23Result.data),
                summary: task2Result.data["detailed content"],
            };
            task24Result = await taskFun(
                "2.4话题评估",
                "/generate_tweet/2/4",
                param24
            );
        } else {
            const param221 = {
                model,
                search: JSON.stringify(task21Result.data.results),
                // topic: task13Result.data.predictionMarketTopic,
                topic: task2Result.data["detailed content"],
            };
            //2.2.1 = 22b为已经包含的预测市场问题选择搜索时间范围
            task24Result = await taskFun(
                "2.2.b为已经包含的预测市场问题选择搜索时间范围",
                "/generate_tweet/2/2/b",
                param221
            );
        }

        //2.5  话题搜索
        const param25 = {
            text: JSON.stringify({
                topic: task24Result.data.topic,
                search_time_range: task24Result.data.search_time_range,
            }),
        };
        const task25Result = await taskFun(
            "2.5话题搜索",
            "/ai/tavily/search",
            param25
        );

        //2.6 第一次话题优化
        const param26 = {
            topic: task24Result.data.topic,
            search: JSON.stringify(task25Result.data.results),
        };
        const task26Result = await taskFun(
            "2.6 第一次话题优化",
            "/generate_tweet/2/6",
            param26
        );

        const param271 = {
            query: task26Result.data.topic,
            user_name: username,
            type: "2", // 1 短推 2 长推
            model,
        };
        const task271Result = await taskFun(
            "2.7.1搜索记忆",
            "/ai/query_memory",
            param271
        );

        const param272 = {
            memory: JSON.stringify(task271Result.data),
            model,
            search: JSON.stringify(task25Result.data.results),
            topic: task26Result.data.topic,
        };

        const task272Result = await taskFun(
            "2.7.2判断是否继续",
            "/generate_tweet/2/7/2",
            param272
        );
        // task272Result
        // case 1: same_user_input=false，update_content=false, 跳过2.7.3 阐明话题更新方向，进入3.关键词检索；后续在需要在进入4.2a 4.4a
        // case 2: same_user_input=true, update_content=false, 返回“我们已经聊过这个话题了“,终止话题
        // case 3: same_user_input=true, update_content=true, 进入2.7.3阐明话题更新方向，在后续步骤不进入'4.2a 4.4a'，而是需要进入4.2b 4.4b
        // case 4: same_user_input=false， update_content=true，报错”这不是预期的组合“
        // let type = "";
        const type = "a"
        // let { same_user_input, update_content } = task272Result.data;
        // if (typeof same_user_input === 'boolean') {
        //     same_user_input = JSON.stringify(same_user_input);
        // }
        // if (typeof update_content === 'boolean') {
        //     update_content = JSON.stringify(update_content);
        // }
        // if (same_user_input === "false" && update_content === "false") {
        //     type = "a";
        // } else if (same_user_input === "true" && update_content === "false") {

        //     const otherStep = {
        //         title: "我们已经聊过这个话题了", // 动态生成标题
        //         jsonData: "{}",
        //         input: "",
        //     }
        //     return otherStep;
        // } else if (same_user_input === "true" && update_content === "true") {
        //     type = "b";
        // } else if (same_user_input === "true" && update_content === "true") {
        //     const otherStep = {
        //         title: "这不是预期的组合", // 动态生成标题
        //         jsonData: "{}",
        //         input: "",
        //     }
        //     return otherStep;
        // }
        // debugger;
        // console.log(type, 'type')

        // 阐明话题更新方向
        let task273Result = null;
        if (type === "a") {
        } else if (type === "b") {
            const param273 = {
                memory: JSON.stringify(task271Result.data),
                model,
                search: JSON.stringify(task272Result.data),
                topic: task26Result.data.topic,
            };

            task273Result = await taskFun(
                "2.7.3 阐明话题更新方向",
                "/generate_tweet/2/7/3",
                param273
            );
            console.log(task273Result);
        }

        //3.1 关键词生成
        const task31Title = "3.1 关键词生成";
        const task31Payload = {
            topic: task26Result.data.topic,
            model,
        };
        const task31Id = await startTask("/generate_tweet/3/1", task31Payload);
        const task31Result = await waitForTaskCompletion(task31Id);
        const task31Step = {
            title: task31Title, // 动态生成标题
            jsonData: task31Result.res,
            input: task31Payload,
        };
        //3.2 第三次搜索：关键词搜索
        const task32Title = "3.2 第三次搜索：关键词搜索";
        const task32Payload = {
            text: JSON.stringify(task31Result.data.keys),
            model,
        };
        const task32Id = await startTask("/ai/tavily/search", task32Payload);
        const task32Result = await waitForTaskCompletion(task32Id);
        const task32Step = {
            title: task32Title, // 动态生成标题
            jsonData: task32Result.res,
            input: task32Payload,
        };
        //3.3 关键词搜索结果总结和分析
        const task33Title = "3.3 关键词搜索结果总结和分析";
        const task33Payload = {
            keywords: JSON.stringify(task31Result.data.keys),
            search: JSON.stringify(task32Result.data.results),
            model,
            topic: task26Result.data.topic,
        };
        const task33Id = await startTask("/generate_tweet/3/3", task33Payload);
        const task33Result = await waitForTaskCompletion(task33Id);
        const task33Step = {
            title: task33Title, // 动态生成标题
            jsonData: task33Result.res,
            input: task33Payload,
        };
        //4.1 第四次搜索：对话题搜索
        const task41Title = "4.1 第四次搜索：对话题搜索";
        const task41Payload = {
            text: task26Result.data.topic,
            model,
        };
        const task41Id = await startTask("/ai/tavily/search", task41Payload);
        const task41Result = await waitForTaskCompletion(task41Id);
        const task41Step = {
            title: task41Title, // 动态生成标题
            jsonData: task41Result.res,
            input: task41Payload,
        };
        //4.2 对于话题进行提问
        const param42ab: any = {
            reason: task26Result.data.reason,
            topic: task26Result.data.topic,
            keywords: JSON.stringify(task33Result.data),
            search: JSON.stringify(task41Result.data.results),
            model,
        };
        if (task273Result) {
            param42ab.result = JSON.stringify(task273Result.data);
        }
        const task42abResult = await taskFun(
            `4.2${type}对于话题进行提问`,
            `/generate_tweet/4/2/${type}`,
            param42ab
        );

        const {
            date_range_question_1,
            date_range_question_2,
            date_range_question_3,
            question_1,
            question_2,
            question_3,
        } = task42abResult.data;

        //         长推更新
        // - 增加流程{2.7 检索记忆数据库并且决策}
        // - 增加流程{4.2b 对于话题进行提问}
        // - 增加流程{4.4b大纲生成}
        // - 增加流程{4.7记忆储存}
        // - 增加流程{[确定数据来源前不需要工程更新]4.5.1生成预测市场的概率预测推文}

        //4.3.1 问题 i 的搜索(i=1,2,3)
        const task4311Title = "4.3.1 问题 1的搜索";
        const task4311Payload = {
            model,
            text: JSON.stringify({ date_range_question_1, question_1 }),
        };
        const task4311Id = await startTask(
            "/ai/tavily/search",
            task4311Payload
        );
        const task4311Result = await waitForTaskCompletion(task4311Id);
        const task4311Step = {
            title: task4311Title, // 动态生成标题
            jsonData: task4311Result.res,
            input: task4311Payload,
        };

        const task4312Title = "4.3.1 问题 2的搜索";
        const task4312Payload = {
            model,
            text: JSON.stringify({ date_range_question_2, question_2 }),
        };
        const task4312Id = await startTask(
            "/ai/tavily/search",
            task4312Payload
        );
        const task4312Result = await waitForTaskCompletion(task4312Id);
        const task4312Step = {
            title: task4312Title, // 动态生成标题
            jsonData: task4312Result.res,
            input: task4312Payload,
        };

        const task4313Title = "4.3.1 问题 3的搜索";
        const task4313Payload = {
            model,
            text: JSON.stringify({ date_range_question_3, question_3 }),
        };
        const task4313Id = await startTask(
            "/ai/tavily/search",
            task4313Payload
        );
        const task4313Result = await waitForTaskCompletion(task4313Id);
        const task4313Step = {
            title: task4313Title, // 动态生成标题
            jsonData: task4313Result.res,
            input: task4313Payload,
        };

        //4.3.2 对于问题i的搜索内容做总结
        const task4321Title = "4.3.2 问题 1的搜索内容做总结";
        const task4321Payload = {
            model,
            questions: question_1,
            search: JSON.stringify(task4311Result.data.results),
            topic: task26Result.data.topic,
        };
        const task4321Id = await startTask(
            "/generate_tweet/4/3/2",
            task4321Payload
        );
        const task4321Result = await waitForTaskCompletion(task4321Id);
        const task4321Step = {
            title: task4321Title, // 动态生成标题
            jsonData: task4321Result.res,
            input: task4321Payload,
        };

        //4.3.2 对于问题i的搜索内容做总结
        const task4322Title = "4.3.2 问题 2的搜索内容做总结";
        const task4322Payload = {
            model,
            questions: question_2,
            search: JSON.stringify(task4312Result.data.results),
            topic: task26Result.data.topic,
        };
        const task4322Id = await startTask(
            "/generate_tweet/4/3/2",
            task4322Payload
        );
        const task4322Result = await waitForTaskCompletion(task4322Id);
        const task4322Step = {
            title: task4322Title, // 动态生成标题
            jsonData: task4322Result.res,
            input: task4322Payload,
        };

        //4.3.2 对于问题i的搜索内容做总结
        const task4323Title = "4.3.2 问题 3的搜索内容做总结";
        const task4323Payload = {
            model,
            questions: question_3,
            search: JSON.stringify(task4313Result.data.results),
            topic: task26Result.data.topic,
        };
        const task4323Id = await startTask(
            "/generate_tweet/4/3/2",
            task4323Payload
        );
        const task4323Result = await waitForTaskCompletion(task4323Id);
        const task4323Step = {
            title: task4323Title, // 动态生成标题
            jsonData: task4323Result.res,
            input: task4323Payload,
        };

        //4.4大纲生成
        const task44Title = `4.4${type}}大纲生成`;
        const task44Payload: any = {
            model,
            result1: JSON.stringify(task4321Result.data),
            result2: JSON.stringify(task4322Result.data),
            result3: JSON.stringify(task4323Result.data),
            topic: task26Result.data.topic,
            search: JSON.stringify(task33Result.data),
        };
        if (task273Result) {
            task44Payload.direction = JSON.stringify(task273Result.data);
            debugger;
        }
        const task44Id = await startTask(
            `/generate_tweet/4/4/${type}`,
            task44Payload
        );
        const task44Result = await waitForTaskCompletion(task44Id);
        const task44Step = {
            title: task44Title, // 动态生成标题
            jsonData: task44Result.res,
            input: task44Payload,
        };

        //4.5 长推生成
        const task45Title = "4.5 长推生成";
        const task45Payload = {
            model,
            keywords: JSON.stringify(task33Result.data),
            outline: JSON.stringify(task44Result.data),
            result1: JSON.stringify(task4321Result.data),
            result2: JSON.stringify(task4322Result.data),
            result3: JSON.stringify(task4323Result.data),
            topic: task26Result.data.topic,
        };
        const task45Id = await startTask("/generate_tweet/4/5", task45Payload);
        const task45Result = await waitForTaskCompletion(task45Id);
        const task45Step = {
            title: task45Title, // 动态生成标题
            jsonData: task45Result.res,
            input: task45Payload,
        };

        let task451Result: any = null;
        let task452Result: any = null;
        // 暂时写死url
        if (includeUrl) {
            const param451 = {
                url: purl,
            };
            task451Result = await taskFun(
                "4.5.1 爬取polymarket赔率数据",
                "/generate_tweet/4/5/1",
                param451
            );

            const param452 = {
                data: JSON.stringify(task451Result.data),
                model,
                text: JSON.stringify(task45Result.data),
                topic: task26Result.data.topic,
            };

            task452Result = await taskFun(
                "4.5.2 生成预测市场的概率预测推文",
                "/generate_tweet/4/5/2",
                param452
            );
        }
        //4.6 风格渲染
        const task46Title = "4.6 风格渲染";
        const task46Payload = {
            model,
            topic: task26Result.data.topic,
            text: JSON.stringify(task45Result.data),
        };
        const task46Id = await startTask("/generate_tweet/4/6", task46Payload);
        const task46Result = await waitForTaskCompletion(task46Id);

        // 4.7 追加整合
        if (task452Result) {
            task46Result.data.tweet = task452Result.data.short_tweet;
        }

        const task46Step: any = {
            title: task46Title, // 动态生成标题
            jsonData: JSON.stringify(task46Result.data),
            input: task46Payload,
        };

        console.log(task46Step, '渲染完成')


        const pushMemoryParams = {
            model,
            query: inputValue,
            reply: JSON.stringify(task46Result.data),
            type: "2",
            user_name: username,
        };
        const memoryResult = await taskFun(
            "4.8记忆储存",
            "/ai/push_memory",
            pushMemoryParams
        );
        console.log(memoryResult);
        return {
            result: task46Step
        }
    } catch (error: any) {
        console.log(error, 'error')

        bot.sendMessage(chatId, error.toString())
            .then(() => {
                console.log('Message sent successfully');
            })
            .catch((error: any) => {
                console.error('Error sending message:', error);
            });
        return {
            error: error.toString()
        }
    }
};



export const handleAddStepPre = async (inputValue: string, rules = '') => {
    if (!inputValue) {
        alert("请输入topic");
        return;
    }
    if (!rules) {
        alert("请输入rules");
        return;
    }
    try {
        // case
        //   {
        //     topic: "Will Trump issue an executive order on March 10?",
        //     rules: "This market will resolve "Yes" if Donald Trump signs an executive order on March 10, 2025. Otherwise, this market will resolve to "No". Executive actions will not qualify toward this market’s resolution. This market will immediately resolve "Yes" if the text of an executive order for the given day is published on the White House page for presidential actions (https://www.whitehouse.gov/presidential-actions/) or the White House press pool. Mere announcements will not qualify. If no executive order is published by 12:00 PM ET the day after the listed date of this market, this market will resolve to “No”. In the case of ambiguity, this market will use the federal register as the resolution source (https://www.federalregister.gov/presidential-documents/executive-orders)."
        // }
        // 1.1 多语言处理
        const param1 = {
            rules: rules,
            topic: inputValue,
            model,
        };
        //1. 问题类型判断
        const task1Result = await taskFun(
            "1. 问题类型判断",
            "/predict_agent/1",
            param1
        );

        // {
        //   "information_sources": {
        //     "mentioned": "[Yes/No]",
        //     "sources": "[List of specific sources if mentioned, otherwise 'None specified']",
        //     "reasoning": "[Explanation of how the judgment was made]"
        //   },
        //   "data_from_internet": {
        //     "is_internet_data": "[Yes/No]",
        //     "reasoning": "[Explanation of whether the topic/rules involve data like GitHub stars, YouTube subscribers, Twitter followers, etc.]"
        //   }
        // }
        const { data_from_internet } = task1Result.data;

        if (data_from_internet.is_internet_data === "Yes") {
            //2.1 抓取互联网数据
            const param21 = {
                topic: inputValue,
                model,
            };
            const task1Result = await taskFun(
                "2.1 抓取互联网数据",
                "/predict_agent/2/1",
                param21
            );
            console.log(task1Result, "task1Result");
            // {
            //   "type": "the number of the type",
            //   "mark_number": "number of data"
            // }
            const { type, mark_number } = task1Result.data;
            if (type < 4) {
                //3 Appendix I
                const param3 = {
                    model,
                    query: inputValue,
                    type,
                };
                const task3Result = await taskFun(
                    "3 Appendix I",
                    "/predict_agent/3",
                    param3
                );
                // if (task3Result.data.mark_number >= mark_number) {
                //   return "Based on current status, this market will be resolved to `Yes`.";
                // } else {
                //   return "Based on current status, this market will be resolved to `No`.";
                // }
                const taskStep = {
                    title: "最后结果",
                    jsonData: `Based on current status, this market will be resolved to ${task3Result.data >= safeConvert(mark_number) ? "Yes" : "No"
                        }`,
                };
                console.log(task3Result.data, safeConvert(mark_number))
                // 不执行后面的逻辑了
                return {
                    result: taskStep
                }
            }
        }
        //2.2 搜索相关新闻
        const param22 = {
            topic: inputValue,
            model,
        };
        const task22Result = await taskFun(
            "2.2 搜索相关新闻",
            "/predict_agent/2/2",
            param22
        );
        //2.3 事实判断
        const param23 = {
            topic: inputValue,
            result: JSON.stringify(task22Result.data.result),
            rules,
            model,
        };
        // {
        //   "answer":  "[Yes / No / No Result]",
        //   "reason": "Explanation of how the judgment was made with reference to given information"
        //   }
        const task23Result = await taskFun(
            "2.3 事实判断",
            "/predict_agent/2/3",
            param23
        );
        const { answer } = task23Result.data;
        const taskStep = {
            title: "最后结果",
            jsonData: `Based on current status, this market will be resolved to ${answer}`,
        };

        return {
            result: taskStep
        }

    } catch (error: any) {
        bot.sendMessage(chatId, error.toString())
            .then(() => {
                console.log('Message sent successfully');
            })
            .catch((error: any) => {
                console.error('Error sending message:', error);
            });
        return {
            error: error.toString()
        }
    }
};