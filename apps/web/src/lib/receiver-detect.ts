interface UserIdentity {
  uid: string;
  email?: string | null;
}

interface ReceiverIdentity {
  uid?: string;
  email?: string | null;
}

export function isReceiver(user: UserIdentity, receiver: ReceiverIdentity): boolean {
  if (receiver.uid && receiver.uid === user.uid) {
    return true;
  }

  if (receiver.email && user.email) {
    return receiver.email.trim().toLowerCase() === user.email.trim().toLowerCase();
  }

  return false;
}
