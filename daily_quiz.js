'use strict';

const DAILY_QUIZ_QUESTION_URL = '/ajax/animeGetQuestion.php';
const DAILY_QUIZ_ANSWER_URL = '/ajax/animeAnsQuestion.php';
const DAILY_QUIZ_OPTION_KEYS = ['a1', 'a2', 'a3', 'a4'];

/**
 * The quiz API returns HTML fragments; read them as plain text without running anything in them.
 * @param {string} html
 * @returns {string}
 **/
function htmlToText(html) {
    return new DOMParser().parseFromString(String(html ?? ''), 'text/html').body.textContent.trim();
}

/**
 * @param {Object} response - animeAnsQuestion.php result
 * @returns {{ correct: boolean, message: string }}
 **/
function getQuizAnswerResult(response) {
    if (response?.error) {
        const message = response.msg === '答題錯誤'
            ? '很遺憾答錯囉！可以再答一次，或先上動畫瘋粉絲團找答案喔！'
            : (response.msg || '答題失敗');
        return { correct: false, message };
    }
    const gift = htmlToText(response?.gift);
    return { correct: true, message: gift ? `恭喜答對！${gift}` : '恭喜答對！' };
}

/**
 * Round button left of the settings button that opens today's 動漫通 quiz,
 * e.g. after autoplay or marathon mode skipped it.
 **/
function createDailyQuizButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'anigamerkitQuizBtn';
    button.className = 'anigamerkit-quiz-button';
    button.textContent = '答';
    button.title = '動漫通每日答題';
    button.addEventListener('click', () => openDailyQuiz(button));
    document.body.appendChild(button);
}

/**
 * Wrong answers can be retried with a new question; the API only refuses once today's quiz
 * has been answered correctly ("今日已經答過題目了"), or when not signed in.
 * @returns {Promise<{ question: Object|null, message: string }>}
 **/
async function fetchQuizQuestion() {
    try {
        const url = new URL(DAILY_QUIZ_QUESTION_URL, window.location.origin);
        url.searchParams.set('t', Date.now());
        const question = await fetch(url, { credentials: 'include' }).then((response) => response.json());
        if (question?.error || !question?.token) {
            return { question: null, message: question?.msg || '目前無法答題' };
        }
        return { question, message: '' };
    } catch (error) {
        console.error('Failed to load quiz:', error);
        return { question: null, message: '無法取得動漫通題目' };
    }
}

async function openDailyQuiz(button) {
    if (document.querySelector('.anigamerkit-quiz-dialog')) {
        return;
    }

    button.disabled = true;
    const { question, message } = await fetchQuizQuestion();
    button.disabled = false;

    if (!question) {
        alert(message);
        return;
    }
    showDailyQuizDialog(question);
}

function showDailyQuizDialog(firstQuestion) {
    const dialog = document.createElement('dialog');
    dialog.className = 'anigamerkit-quiz-dialog';
    dialog.classList.toggle('is-dark', isCookieFlagEnabled(getCookie('ANIME_dark_theme')));
    dialog.addEventListener('close', () => dialog.remove());
    document.body.appendChild(dialog);

    renderQuestion(firstQuestion);
    dialog.showModal();

    function renderQuestion(question) {
        const title = document.createElement('h3');
        title.className = 'anigamerkit-quiz-title';
        title.textContent = '動漫通';

        const game = document.createElement('div');
        game.className = 'anigamerkit-quiz-game';
        game.textContent = `關連作品：${htmlToText(question.game)}`;

        const text = document.createElement('p');
        text.className = 'anigamerkit-quiz-question';
        text.textContent = `${htmlToText(question.question)}（作者：${htmlToText(question.userid)}）`;

        const options = document.createElement('div');
        options.className = 'anigamerkit-quiz-options';

        const result = document.createElement('p');
        result.className = 'anigamerkit-quiz-result';
        result.hidden = true;

        const actions = document.createElement('div');
        actions.className = 'anigamerkit-quiz-actions';

        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'anigamerkit-quiz-action';
        retry.textContent = '再答一次';
        retry.hidden = true;
        retry.addEventListener('click', async () => {
            retry.disabled = true;
            const next = await fetchQuizQuestion();
            if (next.question) {
                renderQuestion(next.question);
            } else {
                result.textContent = next.message;
                retry.disabled = false;
            }
        });

        // Closing without an answer submits nothing (the player's own close button answers 0)
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'anigamerkit-quiz-action';
        close.textContent = '關閉';
        close.addEventListener('click', () => dialog.close());
        actions.append(retry, close);

        const optionButtons = DAILY_QUIZ_OPTION_KEYS.map((key, index) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'anigamerkit-quiz-option';
            option.textContent = htmlToText(question[key]);
            option.addEventListener('click', () => submitAnswer(index + 1, option));
            options.appendChild(option);
            return option;
        });

        dialog.replaceChildren(title, game, text, options, result, actions);

        async function submitAnswer(answer, option) {
            optionButtons.forEach((button) => {
                button.disabled = true;
            });
            option.classList.add('is-selected');

            const body = new FormData();
            body.append('token', question.token);
            body.append('ans', answer);
            let correct = false;
            try {
                const response = await fetch(DAILY_QUIZ_ANSWER_URL, { method: 'POST', credentials: 'include', body })
                    .then((res) => res.json());
                const answerResult = getQuizAnswerResult(response);
                correct = answerResult.correct;
                result.textContent = answerResult.message;
            } catch (error) {
                console.error('Failed to submit quiz answer:', error);
                result.textContent = '送出答案失敗';
            }
            result.classList.toggle('is-correct', correct);
            result.classList.toggle('is-wrong', !correct);
            result.hidden = false;
            // A wrong answer can be retried with a new question until one is answered correctly
            retry.hidden = correct;
        }
    }
}
