import { Ulid } from 'id128';

export const generateId = () => {
    return Ulid.generate({ time: new Date() }).toRaw().slice(-6);
};
