<?php

namespace App\Services;

class TriageQuestions
{
    /**
     * @return array<string, array<string, array<int, string>>>
     */
    public static function all(): array
    {
        return [
            'EN' => [
                'CHEST' => [
                    'Are you having trouble breathing?',
                    'Is the pain spreading to your left arm or jaw?',
                    'Are you sweating heavily or feeling faint?',
                    'On a scale of 1–10, how painful is it?',
                ],
                'FEVER' => [
                    'How long have you had the fever?',
                    'Do you have chills or body aches?',
                    'Are you vomiting or unable to keep fluids down?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'EYE' => [
                    'When did the eye problem start?',
                    'Do you have vision changes or blurred vision?',
                    'Is there discharge or severe pain?',
                    'On a scale of 1–10, how painful is it?',
                ],
                'GI' => [
                    'Where exactly is the abdominal pain?',
                    'Are you vomiting or having diarrhea?',
                    'Do you have fever or blood in stool?',
                    'On a scale of 1–10, how painful is it?',
                ],
                'HEAD' => [
                    'When did the headache start?',
                    'Is it the worst headache of your life?',
                    'Do you have fever or neck stiffness?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'RESP' => [
                    'Do you have shortness of breath?',
                    'Are you coughing or wheezing?',
                    'Do you have chest tightness or fever?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'SKIN' => [
                    'What does the rash or skin problem look like?',
                    'Is there swelling or severe itching?',
                    'Do you have fever or rapid spread?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'NEURO' => [
                    'Do you have weakness, numbness, or trouble speaking?',
                    'Did this start suddenly?',
                    'Do you have severe headache or dizziness?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'URO' => [
                    'Do you have pain while urinating?',
                    'Is there blood in the urine?',
                    'Do you have fever or lower back pain?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'MUSCULO' => [
                    'Which joint or muscle hurts?',
                    'Was there an injury or swelling?',
                    'Do you have fever or redness around the area?',
                    'On a scale of 1–10, how severe is it?',
                ],
                'GENERAL' => [
                    'What symptoms are you feeling right now?',
                    'When did the symptoms start?',
                    'Do you have any breathing difficulty?',
                    'On a scale of 1–10, how severe is it?',
                ],
            ],
            'PIDGIN' => [
                'CHEST' => [
                    'You dey find breathe?',
                    'Di pain dey go reach your left hand or jaw?',
                    'You dey sweat well well or you dey feel like faint?',
                    'From 1–10, how the pain be?',
                ],
                'FEVER' => [
                    'How long you don get the fever?',
                    'You dey feel cold or body dey pain you?',
                    'You dey vomit or you no fit keep water?',
                    'From 1–10, how e strong?',
                ],
                'GENERAL' => [
                    'Wetin you dey feel now?',
                    'When the matter start?',
                    'You dey find breathe?',
                    'From 1–10, how e strong?',
                ],
            ],
            'YORUBA' => [
                'CHEST' => [
                    'Ṣe o nira lati simi?',
                    'Ṣe irora naa n tan si ọwọ osi tabi ọ̀run?',
                    'Ṣe o n lagun pupọ tabi o n rẹ̀?',
                    'Lati 1 sí 10, bawo ni irora ṣe pọ?',
                ],
                'FEVER' => [
                    'Fun igba melo ni o ti ni iba?',
                    'Ṣe ara rẹ n dun tabi o n tutu?',
                    'Ṣe o n ṣàn ẹ̀jẹ̀ tabi o ko le mu omi duro?',
                    'Lati 1 sí 10, bawo ni o ṣe le?',
                ],
                'GENERAL' => [
                    'Kini o n lero bayii?',
                    'Nigbawo ni o bẹrẹ?',
                    'Ṣe o nira lati simi?',
                    'Lati 1 sí 10, bawo ni o ṣe le?',
                ],
            ],
            'HAUSA' => [
                'CHEST' => [
                    'Kana da wahalar numfashi?',
                    'Zafin yana zuwa hannun hagu ko gemu?',
                    'Kana zufa sosai ko kana jin kasala?',
                    'Daga 1–10, yaya zafin yake?',
                ],
                'FEVER' => [
                    'Tsawon nawa kake da zazzabi?',
                    'Kana jin sanyi ko ciwon jiki?',
                    'Kana amai ko ba ka iya rike ruwa?',
                    'Daga 1–10, yaya tsanani yake?',
                ],
                'GENERAL' => [
                    'Me kake ji a yanzu?',
                    'Yaushe aka fara?',
                    'Kana da wahalar numfashi?',
                    'Daga 1–10, yaya tsanani yake?',
                ],
            ],
            'IGBO' => [
                'CHEST' => [
                    'Ị na-enwe nsogbu iku ume?',
                    'Ọ́rịa ahụ na-aga n’aka ekpe ma ọ bụ n’ọnụ?',
                    'Ị na-asọ ọtụtụ ahụ ma ọ bụ ị na-eche ka ị daa?',
                    'Site na 1–10, otú ọ́rịa ahụ siri ike?',
                ],
                'FEVER' => [
                    'Oge ole ka ị nwere fever?',
                    'Ị na-enwe ahụ mgbu ma ọ bụ oyi?',
                    'Ị na-agbọ agbọ ma ọ bụ ị gaghị enwe ike idobe mmiri?',
                    'Site na 1–10, otu o siri ike?',
                ],
                'GENERAL' => [
                    'Kedu ihe ị na-ahụ ugbu a?',
                    'Kedu mgbe ọ malitere?',
                    'Ị na-enwe nsogbu iku ume?',
                    'Site na 1–10, otu o siri ike?',
                ],
            ],
        ];
    }
}
