"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSM2 = calculateSM2;
/**
 * Tính toán các thông số ôn tập tiếp theo dựa trên thuật toán SM-2 (SuperMemo-2)
 * @param input các chỉ số ôn tập hiện tại và điểm đánh giá
 */
function calculateSM2(input) {
    let { repetition, interval, easiness, rating } = input;
    // 1. Tính toán lại độ dễ Easiness Factor (EF)
    if (rating >= 3) {
        easiness = easiness + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    }
    else {
        // Nếu quên từ vựng, giảm độ dễ nhẹ
        easiness = easiness - 0.2;
    }
    // Giới hạn dưới của Easiness Factor là 1.3
    if (easiness < 1.3) {
        easiness = 1.3;
    }
    // 2. Tính toán khoảng cách ngày ôn tập tiếp theo (Interval)
    if (rating < 3) {
        // Trả lời sai (quên từ): reset lại số lần lặp đúng liên tiếp và xếp lịch ôn ngày mai
        repetition = 0;
        interval = 1;
    }
    else {
        // Trả lời đúng: tăng số lần lặp và nhân rộng khoảng cách
        if (repetition === 0) {
            interval = 1;
        }
        else if (repetition === 1) {
            interval = 6;
        }
        else {
            interval = Math.round(interval * easiness);
        }
        repetition = repetition + 1;
    }
    // 3. Tính toán mốc ngày ôn tập tiếp theo (reset về 00:00 của ngày tương lai)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    nextReviewDate.setHours(0, 0, 0, 0);
    return {
        repetition,
        interval,
        easiness,
        nextReviewDate,
    };
}
