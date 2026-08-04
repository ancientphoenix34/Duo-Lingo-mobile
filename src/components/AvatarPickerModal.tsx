import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { avatars, type AvatarId } from "@/data/avatars";
import { colors } from "@/theme";

interface AvatarPickerModalProps {
  visible: boolean;
  selectedId: AvatarId;
  onSelect: (id: AvatarId) => void;
  onClose: () => void;
}

// Bottom-sheet grid for choosing the Profile screen's avatar. Tapping a
// thumbnail selects it immediately; the sheet stays open so the new
// selection is visible until the user dismisses it.
export function AvatarPickerModal({ visible, selectedId, onSelect, onClose }: AvatarPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-6 pt-5 pb-1">
            <Text className="h3">Choose your avatar</Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface items-center justify-center"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View className="flex-row flex-wrap justify-center gap-4 px-6 pt-4 pb-8">
            {avatars.map((avatar) => {
              const isSelected = avatar.id === selectedId;

              return (
                <Pressable
                  key={avatar.id}
                  onPress={() => onSelect(avatar.id)}
                  style={[styles.thumbnailRing, isSelected && styles.thumbnailRingSelected]}
                >
                  <Image source={avatar.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const THUMBNAIL_SIZE = 68;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 19, 43, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  thumbnailRing: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  thumbnailRingSelected: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: THUMBNAIL_SIZE / 2,
  },
  checkBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
});
