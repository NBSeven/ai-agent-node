// // 设置购买nft的价格区间
// /**
//  * 批量购买最优价的nft
//  */
// export const batchBuyNft = async (PRIVATE_KEY: string, minPrice: number, maxPrice: number, buyLimit: number = 1) => {

//     interface bestParam {
//         collection_slug: string
//         minPrice: number
//         maxPrice: number
//         limit?: number
//         next?: string
//     }
//     // let PRIVATE_KEY = '63dd7375a665aafa5bafd46b4db8943c693438c62e3b21ece08102360d595a1d'

//     const walletWithProvider = new ethers.Wallet(PRIVATE_KEY, provider);

//     const openseaSDK = new OpenSeaSDK(walletWithProvider, {
//         chain: Chain.Sepolia, //Chain.Sepolia Chain.Mainnet
//         apiKey: YOUR_API_KEY,
//     });

//     const accountAddress = walletWithProvider.address // The buyer's wallet address, also the taker\
//     /**
//      * 获取nft最优报价，需手动过滤价格
//      * @param param0 
//      * @returns 
//      */
//     const getBestListings = async ({ collection_slug, limit, minPrice, maxPrice }: bestParam) => {
//         const res = await openseaSDK.api.getBestListings(collection_slug, limit)
//         console.log(res, 'getBestListings')
//         // console.log(res.listings[0].price)
//         // console.log(res.listings[0].order_hash)
//         // console.log(res.listings[0].protocol_data)
//         // 过滤订单根据价格区间
//         const filteredOrders = res.listings.filter(order => {
//             const price = parseFloat(ethers.formatEther(order.price.current.value.toString()));
//             return price >= minPrice && price <= maxPrice;
//         });
//         return filteredOrders
//     }
//     /**
//      * 购买nft
//      * @param order 
//      */
//     const buyItem = async (order: Order) => {
//         try {
//             const transactionHash = await openseaSDK.fulfillOrder({ order, accountAddress })
//             console.log('Transaction successfully submitted. Hash:', transactionHash);
//             // 查询交易状态
//             const receipt = await provider.getTransactionReceipt(transactionHash);
//             if (receipt?.status === 1) {
//                 console.log('Transaction succeeded');
//                 return 'Transaction succeeded'
//             } else {
//                 console.log('Transaction failed');
//                 return 'Transaction failed'

//             }
//         } catch (error) {
//             console.log(error);
//             return 'Transaction failed | error'
//         }

//     }

//     // 设置购买nft的价格区间
//     // const minPrice = 0.01
//     // const maxPrice = 0.2
//     let orders = await getBestListings({ collection_slug, limit: buyLimit, minPrice, maxPrice })
//     console.log(orders, 'orders')
//     let res = await buyItem(orders[0])
//     return res
//     // let nonce = await provider.getTransactionCount(walletWithProvider.address)
//     // console.log(nonce, 'nonce')
//     // for (let i = 0; i < orders.length; i++) {
//     //     // let newNonce = nonce + i + 1
//     //     // console.log(newNonce, 'newNonce')
//     //     setTimeout(() => {
//     //         try {
//     //             buyItem(orders[i], newNonce)
//     //         } catch (error) {
//     //             console.log(error)
//     //         }
//     //     }, i * 1000)
//     // }
// }

const model = 'gpt-4o'
const modelo1 = "gpt-o1";

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
    const response = await fetch(
        `https://myapp-258904095968.asia-east1.run.app/${path}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskPayload),
        }
    );
    const data = await response.json();
    //
    return data.task_id; // 假设任务 ID 存在于 data.taskId
}

// 模拟任务状态查询接口：根据任务 ID 查询状态
async function checkTaskStatus(task_id: string): Promise<any> {
    const response = await fetch(
        `https://myapp-258904095968.asia-east1.run.app/v1.3/task/${task_id}`
    );
    const data = await response.json();
    return data; // 假设返回的 data 包含 { status: "pending" | "success" | "error", result: any }
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
            console.error(`任务执行失败: ${taskId} ${statusResponse.message}`);
            throw new Error(`任务执行失败: ${taskId}`);
        } else if (statusResponse.status === "failed") {
            console.error(`Task failed:${statusResponse.error}`);
            throw new Error(`任务执行失败: ${taskId}`);
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
    // map.set(1, "3.2 arthur_1短文本/评论风格渲染");
    // map.set(2, "3.4 arthur_2长文本风格渲染");
    // map.set(3, "3.3 arthur_3风格渲染");
    // map.set(4, "3.5 arthur_4风格渲染");
    // map.set(5, "3.6 arthur_5风格渲染");

    map.set(1, "3.1 arthur_1短文本/评论风格渲染");
    map.set(2, "3.2 InsiderFinance");
    map.set(3, "3.3 Jon Crabb");
    map.set(4, "3.4 0xANN");

    map.set(5, "4.1 InsiderFinance");
    map.set(6, "4.2 Jon Crabb");
    map.set(7, "4.3 0xANN");
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

export const handleAddStep = async (inputValue: string, type = 1) => {
    if (!inputValue) {
        alert("请输入描述内容");
        return;
    }

    try {
        // 1.1 多语言处理
        const task1Title = "1.1 多语言处理";
        const task1Payload = { text: inputValue, model }; // 初始参数
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
            const task3Title = "1.3.1，使用 tavily 搜索前 10 条内容";
            const task3Payload = {
                text: task1Result.data.topic,
                model,
            };
            const task3Id = await startTask("/ai/tavily/search", task3Payload);
            const task3Result = await waitForTaskCompletion(task3Id);
            const task3Step = {
                title: task3Title, // 动态生成标题
                jsonData: task3Result.res,
            };

            // 1.3.2 非预测市场话题回复生成
            const task4Title = "1.3.2 非预测市场话题回复生成";
            const task4Payload = {
                text: task1Result.data.topic,
                model,
                search: task1Result.data.results,
            };
            const task4Id = await startTask("/ai/reply/simple", task4Payload);
            debugger;
            const task4Result = await waitForTaskCompletion(task4Id);
            debugger;
            const task4Step = {
                title: task4Title, // 动态生成标题
                jsonData: task4Result.res,
            };
            debugger;
            // 返回结果
            return {
                result: [task4Step]
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

                const { evaluation_1, evaluation_2, evaluation_3 } =
                    task13Result.data;

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
                        result: [task14Step]
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

                    // let rt1 = await renderText(task14Result.data, inputValue, 1);
                    // let rt2 = await renderText(task14Result.data, inputValue, 2);
                    // let rt3 = await renderText(task14Result.data, inputValue, 3);
                    // let rt4 = await renderText(task14Result.data, inputValue, 4);
                    // let rt5 = await renderText(task14Result.data, inputValue, 5);

                    let rt = await renderText(task14Result.data, inputValue, type);

                    ////返回结果
                    return {
                        result: [rt]
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

                return {
                    result: [rt1]
                }
            }

        }
    } catch (error: any) {

        console.error(error);
        return {
            error: error.toString()
        }
    }
};

export const handleAddStepL = async (inputValue: string, type = 1) => {
    if (!inputValue) {
        alert("请输入描述内容");
        return;
    }
    try {
        // 1.1 多语言处理
        const task1Title = "1.1 多语言处理";
        const task1Payload = { text: inputValue, model }; // 初始参数
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

                    // let rt1 = await renderText(task14Result.data, inputValue, 1);
                    // let rt2 = await renderText(task14Result.data, inputValue, 2);
                    // let rt3 = await renderText(task14Result.data, inputValue, 3);
                    // let rt4 = await renderText(task14Result.data, inputValue, 4);
                    // let rt5 = await renderText(task14Result.data, inputValue, 5);
                    let rt = await renderText(task14Result.data, inputValue, type);

                    ////返回结果
                    return {
                        result: [rt]
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
        return {
            error: error.toString()
        }
    }
};
