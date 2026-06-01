import type { PageReplacementResult, PageReplacementStep } from '@domain/types/page-replacement';
import { buildResult, buildStep, cloneFrames, createEmptyFrames, findEmptyFrameIndex, findFrameIndex } from './shared';

function findNextUse(referenceString: string[], startIndex: number, page: string): number {
	for (let index = startIndex; index < referenceString.length; index++) {
		if (referenceString[index] === page) {
			return index;
		}
	}

	return Number.POSITIVE_INFINITY;
}

export function calculateOPT(referenceString: string[], frameCount: number): PageReplacementResult {
	const frames = createEmptyFrames(frameCount);
	const steps: PageReplacementStep[] = [];

	for (let stepIndex = 0; stepIndex < referenceString.length; stepIndex++) {
		const referencedPage = referenceString[stepIndex];
		const framesBefore = cloneFrames(frames);
		const hitFrameIndex = findFrameIndex(frames, referencedPage);

		if (hitFrameIndex !== -1) {
			steps.push(buildStep({
				stepIndex,
				referencedPage,
				hit: true,
				fault: false,
				replacedPage: null,
				changedFrameIndex: hitFrameIndex,
				framesBefore,
				framesAfter: cloneFrames(frames),
				reason: `Page ${referencedPage} will not be replaced because it is already loaded in frame ${hitFrameIndex + 1}.`,
			}));
			continue;
		}

		const emptyFrameIndex = findEmptyFrameIndex(frames);
		let changedFrameIndex = emptyFrameIndex;
		let replacedPage: number | null = null;

		if (emptyFrameIndex !== -1) {
			frames[emptyFrameIndex] = referencedPage;
		} else {
			let victimFrameIndex = 0;
			let farthestNextUse = -1;

			for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
				const page = frames[frameIndex];
				if (page === null) continue;
				const nextUse = findNextUse(referenceString, stepIndex + 1, page);
				if (nextUse > farthestNextUse) {
					farthestNextUse = nextUse;
					victimFrameIndex = frameIndex;
				}
			}

			changedFrameIndex = victimFrameIndex;
			replacedPage = frames[victimFrameIndex];
			frames[victimFrameIndex] = referencedPage;
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
				: `Replaced page ${replacedPage} with the optimal choice in frame ${changedFrameIndex + 1}.`,
		}));
	}

	return buildResult({
		input: {
			algorithm: 'OPT',
			referenceString,
			frameCount,
		},
		steps,
	});
}
