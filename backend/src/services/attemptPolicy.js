const ATTEMPT_WINDOW_DAYS = 21;
const MAX_ATTEMPTS = 3;

export const getAttemptPolicy = () => ({
	ATTEMPT_WINDOW_DAYS,
	MAX_ATTEMPTS,
});

export const applyAttemptWindowReset = (user, now = new Date()) => {
	let didChange = false;

	const normalizedAttemptCount = Math.min(
		Math.max(Number(user?.assessmentAttemptsCount || 0), 0),
		MAX_ATTEMPTS,
	);

	if (user.assessmentAttemptsCount !== normalizedAttemptCount) {
		user.assessmentAttemptsCount = normalizedAttemptCount;
		didChange = true;
	}

	if (!user?.firstAttemptDate) {
		if (user.attemptsRemaining !== MAX_ATTEMPTS) {
			user.attemptsRemaining = MAX_ATTEMPTS;
			didChange = true;
		}

		return didChange;
	}

	const firstAttemptDate = new Date(user.firstAttemptDate);
	const resetAt = new Date(firstAttemptDate);
	resetAt.setDate(resetAt.getDate() + ATTEMPT_WINDOW_DAYS);

	if (now >= resetAt) {
		user.assessmentAttemptsCount = 0;
		user.attemptsRemaining = MAX_ATTEMPTS;
		user.firstAttemptDate = null;
		user.lastAttemptDate = null;

		return true;
	}

	const expectedRemaining = Math.max(0, MAX_ATTEMPTS - user.assessmentAttemptsCount);

	if (user.attemptsRemaining !== expectedRemaining) {
		user.attemptsRemaining = expectedRemaining;
		didChange = true;
	}

	return didChange;
};
