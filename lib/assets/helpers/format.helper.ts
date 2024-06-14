export const formatResponseQuiz = (text: string): string | null => {
    const match = /<quiz>([\s\S]*?)<\/quiz>/.exec(text);
    if (match) {
        return match[1];
    } else {
        console.log('No <quiz> tag found in the data.');
        return text;
    }
};
