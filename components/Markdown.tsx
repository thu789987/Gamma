import ReactMarkdown from "react-markdown";

export default function Markdown(props: { markdown?: string }) {
    const defaultMarkdown = '# hello *world*!';

    return (
        <ReactMarkdown>
            {props.markdown || defaultMarkdown}
        </ReactMarkdown>
    );
}