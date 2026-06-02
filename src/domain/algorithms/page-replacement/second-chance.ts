import type { PageReplacementResult, PageReplacementStep } from '@domain/types/page-replacement';
import { buildResult, buildStep, cloneFrames, createEmptyFrames, findEmptyFrameIndex, findFrameIndex } from './shared';

export function calculateSecondChance(referenceString: string[], frameCount: number): PageReplacementResult {
	const frames = createEmptyFrames(frameCount);
	const referenceBits = Array.from({ length: frameCount }, () => 0);
	const steps: PageReplacementStep[] = [];
	let clockHand = 0;

	for (let stepIndex = 0; stepIndex < referenceString.length; stepIndex++) {
		const referencedPage = referenceString[stepIndex];
		const framesBefore = cloneFrames(frames);
		const hitFrameIndex = findFrameIndex(frames, referencedPage);

		if (hitFrameIndex !== -1) {
			referenceBits[hitFrameIndex] = 1;
			steps.push(buildStep({
				stepIndex,
				referencedPage,
				hit: true,
				fault: false,
				replacedPage: null,
				changedFrameIndex: hitFrameIndex,
				framesBefore,
				framesAfter: cloneFrames(frames),
				reason: `Page ${referencedPage} hit in frame ${hitFrameIndex + 1}; reference bit refreshed.`,
			}));
			continue;
		}

		const emptyFrameIndex = findEmptyFrameIndex(frames);
		let changedFrameIndex = emptyFrameIndex;
		let replacedPage = null;

		if (emptyFrameIndex !== -1) {
			frames[emptyFrameIndex] = referencedPage;
			referenceBits[emptyFrameIndex] = 1;
			clockHand = (emptyFrameIndex + 1) % frameCount;
		} else {
			while (referenceBits[clockHand] === 1) {
				referenceBits[clockHand] = 0;
				clockHand = (clockHand + 1) % frameCount;
			}

			changedFrameIndex = clockHand;
			replacedPage = frames[clockHand];
			frames[clockHand] = referencedPage;
			referenceBits[clockHand] = 1;
			clockHand = (clockHand + 1) % frameCount;
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
				? `Loaded page ${referencedPage} into frame ${changedFrameIndex + 1} with a reference bit of 1.`
				: `Replaced page ${replacedPage} after giving pages a second chance in frame ${changedFrameIndex + 1}.`,
		}));
	}

	return buildResult({
		input: {
			algorithm: 'SECOND_CHANCE',
			referenceString,
			frameCount,
		},
		steps,
	});
}
