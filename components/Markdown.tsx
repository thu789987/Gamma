import ReactMarkdown from "react-markdown";

export default function Markdown(props: {markdown?: string}) {
    const defaultMarkdown = '# hello *world*!';

    return (
        <ReactMarkdown
        children={props.markdown || defaultMarkdown}
        />
    );
}