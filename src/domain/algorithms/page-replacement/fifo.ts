import type { PageReplacementResult, PageReplacementStep } from '@domain/types/page-replacement';
import { buildResult, buildStep, cloneFrames, createEmptyFrames, findEmptyFrameIndex, findFrameIndex } from './shared';

export function calculateFIFO(referenceString: string[], frameCount: number): PageReplacementResult {
	const frames = createEmptyFrames(frameCount);
	const queue: number[] = [];
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
				reason: `Page ${referencedPage} is already in frame ${hitFrameIndex + 1}.`,
			}));
			continue;
		}

		const emptyFrameIndex = findEmptyFrameIndex(frames);
		let changedFrameIndex = emptyFrameIndex;
		let replacedPage = null;

		if (emptyFrameIndex !== -1) {
			frames[emptyFrameIndex] = referencedPage;
			queue.push(emptyFrameIndex);
		} else {
			changedFrameIndex = queue.shift() ?? 0;
			replacedPage = frames[changedFrameIndex];
			frames[changedFrameIndex] = referencedPage;
			queue.push(changedFrameIndex);
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
				: `Replaced page ${replacedPage} using FIFO in frame ${changedFrameIndex + 1}.`,
		}));
	}

	return buildResult({
		input: {
			algorithm: 'FIFO',
			referenceString,
			frameCount,
		},
		steps,
	});
}
