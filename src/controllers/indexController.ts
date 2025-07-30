import { Context } from 'koa';

import { handleAddStep, handleAddStepL, handleAddStepLN, handleAddStepPre, handleAddStepPreAdvice, handleAddStepT, handleAddStepFirst } from '../services/index';


export const t = async (ctx: Context) => {
    const { text, type, username }: any = ctx.request.body;
    const res = await handleAddStep(text, type, username);
    ctx.body = { message: res };
};

export const l = async (ctx: Context) => {
    const { text, type }: any = ctx.request.body;
    const res = await handleAddStepL(text, type);
    ctx.body = { message: res };
};

export const ln = async (ctx: Context) => {
    const { title, username }: any = ctx.request.body;
    const res = await handleAddStepLN(title, username);
    ctx.body = { message: res };
};



export const pre = async (ctx: Context) => {
    const { topic, rules }: any = ctx.request.body;
    const res = await handleAddStepPre(topic, rules);
    ctx.body = { message: res };
};


export const prea = async (ctx: Context) => {
    const { topic }: any = ctx.request.body;
    const res = await handleAddStepPreAdvice(topic);
    ctx.body = { message: res };
};
export const preaf = async (ctx: Context) => {
    const { topic }: any = ctx.request.body;
    const res = await handleAddStepFirst(topic);
    ctx.body = { message: res };
};

export const predict = async (ctx: Context) => {
    const { title, rules, EndDate }: any = ctx.request.body;
    const res = await handleAddStepT(title, rules, EndDate);
    ctx.body = { message: res };
};

export const getIndex = async (ctx: Context) => {
    ctx.body = 'Hello, this is a GET request!';
};

export const postIndex = async (ctx: Context) => {
    const data = ctx.request.body;
    ctx.body = `Hello, this is a POST request! You sent: ${JSON.stringify(data)}`;
};
