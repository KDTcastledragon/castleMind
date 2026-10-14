import axios from 'axios';

export const tempLoginApi = async (loginId) => {
    const res = await axios.post('/user/tempLogin', { loginId });
    return res.data;
};

export const demoLoginApi = async () => {
    const res = await axios.post('/user/demoLogin');
    return res.data;
};

export const meApi = async () => {
    const res = await axios.get('/user/isMe');
    return res.data;
};

export const logoutApi = async () => {
    await axios.post('/user/logout');
};
