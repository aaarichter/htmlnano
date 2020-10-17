import { isComment } from '../helpers';

const noWhitespaceCollapseElements = new Set([
    'script',
    'style',
    'pre',
    'textarea'
]);

const noTrimWhitespacesArroundElements = new Set([
    // non-empty tags that will maintain whitespace around them
    'a', 'abbr', 'acronym', 'b', 'bdi', 'bdo', 'big', 'button', 'cite', 'code', 'del', 'dfn', 'em', 'font', 'i', 'ins', 'kbd', 'label', 'mark', 'math', 'nobr', 'object', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'select', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'svg', 'textarea', 'time', 'tt', 'u', 'var',
    // self-closing tags that will maintain whitespace around them
    'comment', 'img', 'input', 'wbr'
]);

const noTrimWhitespacesInsideElements = new Set([
    // non-empty tags that will maintain whitespace within them
    'a', 'abbr', 'acronym', 'b', 'big', 'del', 'em', 'font', 'i', 'ins', 'kbd', 'mark', 'nobr', 'rp', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var'
]);

const whitespacePattern = /[\f\n\r\t\v ]{1,}/g;
const onlyWhitespacePattern = /^[\f\n\r\t\v ]+$/;
const NONE = '';
const SINGLE_SPACE = ' ';
const validOptions = ['all', 'aggressive', 'conservative'];

/** Collapses redundant whitespaces */
export default function collapseWhitespace(tree, options, collapseType, tag) {
    collapseType = validOptions.includes(collapseType) ? collapseType : 'conservative';

    tree.forEach((node, index) => {
        if (typeof node === 'string' && !isComment(node)) {
            const prevNode = tree[index - 1];
            const nextNode = tree[index + 1];
            const prevNodeTag = prevNode && prevNode.tag;
            const nextNodeTag = nextNode && nextNode.tag;

            const isTopLevel = !tag || tag === 'html' || tag === 'head';

            const shouldTrim = (
                collapseType === 'all' ||
                isTopLevel ||
                /*
                 * When collapseType is set to 'aggressive', and the tag is not inside 'noTrimWhitespacesInsideElements'.
                 * the first & last space inside the tag will be trimmed
                 */
                (
                    collapseType === 'aggressive' &&
                    !noTrimWhitespacesInsideElements.has(tag)
                )
            );

            node = collapseRedundantWhitespaces(node, collapseType, shouldTrim, tag, prevNodeTag, nextNodeTag);
        }

        const isAllowCollapseWhitespace = !noWhitespaceCollapseElements.has(node.tag);
        if (node.content && node.content.length && isAllowCollapseWhitespace) {
            node.content = collapseWhitespace(node.content, options, collapseType, node.tag);
        }

        tree[index] = node;
    });

    return tree;
}


function collapseRedundantWhitespaces(text, collapseType, shouldTrim = false, currentTag, prevNodeTag, nextNodeTag) {
    if (!text || text.length === 0) {
        return NONE;
    }

    text = text.replace(whitespacePattern, SINGLE_SPACE);

    if (shouldTrim) {
        if (collapseType === 'aggressive') {
            if (onlyWhitespacePattern.test(text)) {
                // "text" only contains whitespaces. Only trim when both prevNodeTag & nextNodeTag are not "noTrimWhitespacesArroundElement"
                // Otherwise the required ONE whitespace will be trimmed
                if (
                    !noTrimWhitespacesArroundElements.has(prevNodeTag) &&
                    !noTrimWhitespacesArroundElements.has(nextNodeTag)
                ) {
                    text = text.trim();
                }
            } else {
                // text contains whitespaces & non-whitespaces
                if (!noTrimWhitespacesArroundElements.has(prevNodeTag)) {
                    text = text.trimStart();
                }

                if (!noTrimWhitespacesArroundElements.has(nextNodeTag)) {
                    text = text.trimEnd();
                }
            }
        } else {
            // collapseType is 'all', trim spaces
            text = text.trim();
        }
    }

    return text;
}
