import React from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Text, StyleProp, TextStyle } from 'react-native';

interface HTMLContentProps {
  content: string;
  style?: StyleProp<TextStyle>;
  fontSize?: number;
}

// Simple function to check if content is HTML
const isHTML = (str: string): boolean => {
  // Check for common HTML tags
  const htmlPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlPattern.test(str);
};

export const HTMLContent: React.FC<HTMLContentProps> = ({ 
  content, 
  style, 
  fontSize = 16 
}) => {
  const { width } = useWindowDimensions();

  // Check if content contains HTML
  if (isHTML(content)) {
    // Render as HTML
    const tagsStyles = {
      body: {
        fontSize: fontSize,
        lineHeight: fontSize * 1.6,
        color: '#333',
      },
      p: {
        marginBottom: 12,
      },
      h1: {
        fontSize: fontSize * 1.8,
        fontWeight: '700' as '700',
        marginBottom: 16,
        marginTop: 16,
      },
      h2: {
        fontSize: fontSize * 1.6,
        fontWeight: '700' as '700',
        marginBottom: 14,
        marginTop: 14,
      },
      h3: {
        fontSize: fontSize * 1.4,
        fontWeight: '700' as '700',
        marginBottom: 12,
        marginTop: 12,
      },
      h4: {
        fontSize: fontSize * 1.2,
        fontWeight: '700' as '700',
        marginBottom: 10,
        marginTop: 10,
      },
      h5: {
        fontSize: fontSize * 1.1,
        fontWeight: '700' as '700',
        marginBottom: 8,
        marginTop: 8,
      },
      h6: {
        fontSize: fontSize,
        fontWeight: '700' as '700',
        marginBottom: 8,
        marginTop: 8,
      },
      ul: {
        marginBottom: 12,
      },
      ol: {
        marginBottom: 12,
      },
      li: {
        marginBottom: 4,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: '#ccc',
        paddingLeft: 12,
        marginLeft: 8,
        marginBottom: 12,
        fontStyle: 'italic' as 'italic',
      },
      code: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
        fontFamily: 'monospace',
        fontSize: fontSize * 0.9,
      },
      pre: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      },
      strong: {
        fontWeight: '700' as '700',
      },
      em: {
        fontStyle: 'italic' as 'italic',
      },
      a: {
        color: '#007AFF',
        textDecorationLine: 'underline' as 'underline',
      },
    };

    return (
      <RenderHtml
        contentWidth={width - 32} // Account for padding
        source={{ html: content }}
        tagsStyles={tagsStyles}
      />
    );
  } else {
    // Render as plain text
    return (
      <Text style={[{ fontSize, lineHeight: fontSize * 1.6, color: '#333' }, style]}>
        {content}
      </Text>
    );
  }
};
