import TelegramBot from 'node-telegram-bot-api';

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
        return data.task_id; // 假设任务 ID 存在于 data.taskId
    } catch (error: any) {
        console.log(error)
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
    const render31Id = await startTask("/ai/style/render", render31Payload);
    const render31Result = await waitForTaskCompletion(render31Id);
    const render31Step = {
        title: render31Title,
        jsonData: render31Result.res,
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
        ...params,
        model,
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

export const handleAddStep = async (inputValue: string, type = 1) => {
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
            text: task1Result.data.topic,
            model,
        };
        const task2Id = await startTask("/ai/predict", task2Payload);
        const task2Result = await waitForTaskCompletion(task2Id);
        const task2Step = {
            title: task2Title, // 动态生成标题
            jsonData: task2Result.res,
        };

        // 1.3 非预测市场话题回复生成
        if (task2Result.data.valuable === false) {
            // const task3Title = "1.3.1，使用 tavily 搜索前 10 条内容";
            // const task3Payload = {
            //     text: task1Result.data.topic,
            //     model,
            // };
            // const task3Id = await startTask("/ai/tavily/search", task3Payload);
            // const task3Result = await waitForTaskCompletion(task3Id);
            // const task3Step = {
            //     title: task3Title, // 动态生成标题
            //     jsonData: task3Result.res,
            // };

            // 1.3.1 非预测市场话题回复生成
            const task4Title = "1.3.1 非预测市场话题回复生成";
            const task4Payload = {
                topic: task1Result.data.topic,
                model,
            };
            const task4Id = await startTask("/ai/reply/simple", task4Payload);
            const task4Result = await waitForTaskCompletion(task4Id);
            const task4Step = {
                title: task4Title, // 动态生成标题
                jsonData: task4Result.res,
            };
            debugger;
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
            debugger;

            const task7Payload = {
                // entities: JSON.stringify(task6Result.data.entities),
                entities: JSON.stringify(
                    task6Result.data.suspected_fictional_entities
                ),
                //{1.4.1的搜索结果}，{1.4.2.2实体搜索结果}
                search: JSON.stringify([
                    ...task5Result.data.results,
                    ...task1422Result.data.results,
                ]),
                model,
            };
            const task7Id = await startTask("/ai/prompt/1422", task7Payload);
            const task7Result = await waitForTaskCompletion(task7Id);
            const task7Step = {
                title: task7Title,
                jsonData: task7Result.res,
            };
            debugger;
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
                debugger;
                const task8Step = {
                    title: task8Title,
                    jsonData: task8Result.res,
                };



                //1.4.3.1差异过大话题判断逻辑
                const param1431 = {
                    result: JSON.stringify(task8Result.data),
                    topic:
                        task2Result.data.selected_topic || task2Result.data.seleted_topic,
                };
                const task1431Result = await taskFun(
                    "1.4.3.1差异过大话题判断逻辑",
                    "/ai/analysis/diff",
                    param1431
                );

                if (task1431Result.data["Large Difference"] === "true") {
                    // 1.3.1 非预测市场话题回复生成
                    const task4Title = "1.3.1 非预测市场话题回复生成";
                    const task4Payload = {
                        topic: task1Result.data.topic,
                        model,
                    };
                    const task4Id = await startTask("/ai/reply/simple", task4Payload);
                    const task4Result = await waitForTaskCompletion(task4Id);
                    const task4Step = {
                        title: task4Title, // 动态生成标题
                        jsonData: task4Result.res,
                    };
                    return {
                        result: task4Step
                    }
                }


                //1.4.4 关键词生成
                debugger;
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
                debugger;
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
                //1.4.8.1 第二次审查
                const param1481 = {
                    search_result: JSON.stringify(dateres147.data.results),
                    optimize_result: JSON.stringify(task12Result.data),
                    judge_result: JSON.stringify(task13Result.data),
                };
                const task1481Result = await taskFun(
                    "1.4.8.1 第二次审查",
                    "/ai/examination/second",
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
                    const task14Id = await startTask("/ai/reply/fact", task14Payload);
                    const task14Result = await waitForTaskCompletion(task14Id);
                    const task14Step = {
                        title: task14Title,
                        jsonData: task14Result.res,
                    };
                    //返回结果
                    return {
                        result: task14Step
                    }
                } else {
                    //1.4.9 回复生成 type_b
                    const task14Title = "1.4.9 回复生成 type_b";
                    debugger;
                    const task14Payload = {
                        // type: 2,
                        // revised_topic: task8Result.data.topic,
                        // revised_topic: task12Result.data.revised_topic,
                        // result: task13Result.data,
                        text: task1Result.data.topic,
                        model,
                        topic: task12Result.data.revised_topic,
                        search: JSON.stringify([
                            ...dateres147.data.results,
                            ...dateres.data.results,
                        ]),
                    };
                    const task14Id = await startTask("/ai/tavily/reply", task14Payload);
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
                };
                let rt1 = await renderText(task16Result.data, inputValue);
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
            text: task1Result.data.topic,
            model,
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
                //{1.4.1的搜索结果}，{1.4.2.2实体搜索结果}
                search: JSON.stringify([
                    ...task5Result.data.results,
                    ...task1422Result.data.results,
                ]),
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

export const handleAddStepLN = async (inputValue: string, summary: string) => {
    if (!summary) {
        return "请输入summary";
    }
    if (!inputValue) {
        return "请输入title";
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

        // 第一次搜索（为翻译提供信息）
        const task121Title = "第一次搜索（为翻译提供信息）";
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

        //1.2 翻译
        const task2Title = "1.2 翻译";
        const task2Payload = {
            search: JSON.stringify(task121Result.data.results),
            model,
            summary,
            title: inputValue,
        };
        const task2Id = await startTask("/generate_tweet/1/2", task2Payload);
        const task2Result = await waitForTaskCompletion(task2Id);
        const task2Step = {
            title: task2Title, // 动态生成标题
            jsonData: task2Result.res,
        };


        //1.3判断是否包含预测市场话题
        const param13 = {
            summary: task2Result.data.summary,
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
        };
        let task24Result = null;
        if (task13Result.data.containsPredictionMarketTopic === "false") {
            //2.2提取话题
            const task22Title = "提取话题";
            const task22Payload = {
                summary: task2Result.data.summary,
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
                summary: task2Result.data.summary,
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
                topic: task13Result.data.predictionMarketTopic,
            };
            //2.2.1 = 22b为已经包含的预测市场问题选择搜索时间范围
            task24Result = await taskFun(
                "2.2.1为已经包含的预测市场问题选择搜索时间范围",
                "/generate_tweet/2/2/1",
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
        };
        //4.2 对于话题进行提问
        const task42Title = "4.2 对于话题进行提问";
        const task42Payload = {
            // keywords: task33Result.data.keywords,
            keywords: JSON.stringify(task33Result.data),
            model,
            reason: task26Result.data.reason,
            search: JSON.stringify(task41Result.data.results),
            topic: task26Result.data.topic,
        };
        const task42Id = await startTask("/generate_tweet/4/2", task42Payload);
        const task42Result = await waitForTaskCompletion(task42Id);
        const task42Step = {
            title: task42Title, // 动态生成标题
            jsonData: task42Result.res,
        };
        const {
            date_range_question_1,
            date_range_question_2,
            date_range_question_3,
            question_1,
            question_2,
            question_3,
        } = task42Result.data;
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
        };

        //4.4大纲生成
        const task44Title = "4.4大纲生成";
        const task44Payload = {
            model,
            result1: JSON.stringify(task4321Result.data),
            result2: JSON.stringify(task4322Result.data),
            result3: JSON.stringify(task4323Result.data),
            topic: task26Result.data.topic,
        };
        const task44Id = await startTask("/generate_tweet/4/4", task44Payload);
        const task44Result = await waitForTaskCompletion(task44Id);
        const task44Step = {
            title: task44Title, // 动态生成标题
            jsonData: task44Result.res,
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
            topic: task24Result.data.topic,
        };
        const task45Id = await startTask("/generate_tweet/4/5", task45Payload);
        const task45Result = await waitForTaskCompletion(task45Id);
        const task45Step = {
            title: task45Title, // 动态生成标题
            jsonData: task45Result.res,
        };

        //4.6 风格渲染
        const task46Title = "4.6 风格渲染";
        const task46Payload = {
            model,
            topic: task26Result.data.topic,
            text: JSON.stringify(task45Result.data),
        };
        const task46Id = await startTask("/generate_tweet/4/6", task46Payload);
        const task46Result = await waitForTaskCompletion(task46Id);
        const task46Step = {
            title: task46Title, // 动态生成标题
            jsonData: task46Result.res,
        };
        console.log(task46Step, '渲染完成')
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