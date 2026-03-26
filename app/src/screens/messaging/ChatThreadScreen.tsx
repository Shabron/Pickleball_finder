import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft, Send } from 'lucide-react-native';
import Avatar from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MOCK_MESSAGES = [
  { id: '1', text: 'Hey, saw your post. Are you still looking for a partner?', senderId: 'other', time: '10:00 AM' },
  { id: '2', text: 'Yes, definitely! Are you available this Saturday morning?', senderId: 'me', time: '10:05 AM' },
  { id: '3', text: 'Saturday works perfectly. What skill level are you looking for exactly?', senderId: 'other', time: '10:08 AM' },
  { id: '4', text: 'I am a 3.0, but open to play with a 3.5. Let\'s meet at Riverside.', senderId: 'me', time: '10:10 AM' },
  { id: '5', text: 'Sounds like a plan. See you there at 9 AM!', senderId: 'other', time: '10:15 AM' },
];

export default function ChatThreadScreen({ navigation }: any) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      senderId: 'me',
      time: 'Just now',
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={28} />
          </TouchableOpacity>
          <Avatar name="Arthur Smith" size={40} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Arthur Smith</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMe = item.senderId === 'me';
            return (
              <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                  {item.text}
                </Text>
                <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                  {item.time}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color="#FFF" size={20} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.s,
  },
  headerInfo: {
    marginLeft: spacing.s,
    flex: 1,
  },
  headerName: {
    ...typography.h3,
    color: colors.text,
  },
  headerStatus: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  messageList: {
    padding: spacing.m,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.m,
    borderRadius: 20,
    marginBottom: spacing.s,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 120,
    ...typography.body,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.m,
    marginBottom: 2, // align with input bottom edge
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
