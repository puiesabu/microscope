// check that the userId specified owns the documwnts
ownsDocument = function(userId, doc) {
  return doc && doc.userId == userId;
}
