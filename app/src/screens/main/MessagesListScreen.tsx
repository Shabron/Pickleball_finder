import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ChatPreview {
  id: string;
  name: string;
  timeAgo: string;
  message: string;
  unreadCount: number;
}

const MOCK_CHATS: ChatPreview[] = [
  { id: '1', name: 'Arthur S.', timeAgo: '2m ago', message: 'Are we on for Tuesday? The courts are booked.', unreadCount: 2 },
  { id: '2', name: 'Clara M.', timeAgo: '1h ago', message: 'I\'m available for mixed doubles in Florida.', unreadCount: 1 },
  { id: '3', name: 'Walter K.', timeAgo: '1h ago', message: 'Thanks! Let\'s team up for the next one.', unreadCount: 0 },
  { id: '4', name: 'Betty L.', timeAgo: 'Yesterday', message: 'Sounds great.', unreadCount: 0 },
];

export default function MessagesListScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.container}>
        <Text style={styles.title}>Messages</Text>
        
        <Input
          placeholder="Search for player or team"
          icon={<Search color={colors.textSecondary} size={20} />}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        <FlatList
          data={MOCK_CHATS}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.chatRow}
              onPress={() => navigation.navigate('ChatThread')}
              activeOpacity={0.7}
            >
              <Avatar name={item.name} size={50} />
              
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{item.name}</Text>
                  <Text style={item.unreadCount > 0 ? styles.timeUnread : styles.timeText}>
                    {item.timeAgo}
                  </Text>
                </View>
                
                <View style={styles.chatFooter}>
                  <Text 
                    style={[styles.messageText, item.unreadCount > 0 && styles.messageUnread]} 
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.m,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  searchInput: {
    marginBottom: spacing.l,
    backgroundColor: colors.background, // lighter for search
    borderColor: 'transparent',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.m,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timeUnread: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.s,
  },
  messageUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.secondary, // or primary based on design
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
  },
});
