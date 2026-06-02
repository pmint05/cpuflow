import type { PageReplacementResult, PageReplacementStep } from '@domain/types/page-replacement';
import { buildResult, buildStep, cloneFrames, createEmptyFrames, findEmptyFrameIndex, findFrameIndex } from './shared';

export function calculateLFU(referenceString: string[], frameCount: number): PageReplacementResult {
	const frames = createEmptyFrames(frameCount);
	const frequency = new Map<string, number>();
	const lastUsed = new Map<string, number>();
	const steps: PageReplacementStep[] = [];

	for (let stepIndex = 0; stepIndex < referenceString.length; stepIndex++) {
		const referencedPage = referenceString[stepIndex];
		const framesBefore = cloneFrames(frames);
		const hitFrameIndex = findFrameIndex(frames, referencedPage);

		if (hitFrameIndex !== -1) {
			frequency.set(referencedPage, (frequency.get(referencedPage) ?? 0) + 1);
			lastUsed.set(referencedPage, stepIndex);
			steps.push(buildStep({
				stepIndex,
				referencedPage,
				hit: true,
				fault: false,
				replacedPage: null,
				changedFrameIndex: hitFrameIndex,
				framesBefore,
				framesAfter: cloneFrames(frames),
				reason: `Page ${referencedPage} hit in frame ${hitFrameIndex + 1}; frequency increased to ${frequency.get(referencedPage)}.`,
			}));
			continue;
		}

		const emptyFrameIndex = findEmptyFrameIndex(frames);
		let changedFrameIndex = emptyFrameIndex;
		let replacedPage = null;

		if (emptyFrameIndex !== -1) {
			frames[emptyFrameIndex] = referencedPage;
			frequency.set(referencedPage, 1);
			lastUsed.set(referencedPage, stepIndex);
		} else {
			let victimFrameIndex = 0;
			let lowestFrequency = Number.POSITIVE_INFINITY;
			let oldestUse = Number.POSITIVE_INFINITY;

			for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
				const page = frames[frameIndex];
				if (page === null) continue;
				const pageFrequency = frequency.get(page) ?? 0;
				const pageLastUsed = lastUsed.get(page) ?? -1;
				if (
					pageFrequency < lowestFrequency ||
					(pageFrequency === lowestFrequency && pageLastUsed < oldestUse) ||
					(pageFrequency === lowestFrequency && pageLastUsed === oldestUse && frameIndex < victimFrameIndex)
				) {
					lowestFrequency = pageFrequency;
					oldestUse = pageLastUsed;
					victimFrameIndex = frameIndex;
				}
			}

			changedFrameIndex = victimFrameIndex;
			replacedPage = frames[victimFrameIndex];
			if (replacedPage !== null) {
				frequency.delete(replacedPage);
				lastUsed.delete(replacedPage);
			}
			frames[victimFrameIndex] = referencedPage;
			frequency.set(referencedPage, 1);
			lastUsed.set(referencedPage, stepIndex);
		}

		steps.push(buildStep({
			stepIndex,
			referencedPage,
			hit: false,
			fault: true,
			replacedPage,
			changedFrameIndex,
			framesBefore,
			framesAfter: cloneFrames(frames),
			reason: replacedPage === null
				? `Loaded page ${referencedPage} into frame ${changedFrameIndex + 1}.`
				: `Replaced least-frequently-used page ${replacedPage} in frame ${changedFrameIndex + 1}.`,
		}));
	}

	return buildResult({
		input: {
			algorithm: 'LFU',
			referenceString,
			frameCount,
		},
		steps,
	});
}
