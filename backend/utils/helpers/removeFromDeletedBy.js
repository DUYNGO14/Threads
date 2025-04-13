export default function removeFromDeletedBy(conversation, userIds = []) {
  const originalLength = conversation.deletedBy.length;
  conversation.deletedBy = conversation.deletedBy.filter(
    (id) => !userIds.includes(id.toString())
  );
  return conversation.deletedBy.length !== originalLength;
}
