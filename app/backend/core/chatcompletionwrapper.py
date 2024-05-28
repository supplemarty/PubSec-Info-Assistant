def test_chatcompletion(chat_completion: list | dict) -> str:
    """
    Test for filters and no content
    Args:
        chat_completion (list | dict): The chat completion to test
    Returns:
        str: content if exists
    """    
    c = chat_completion.choices[0]
    if ("content" in c.message):
        return c.message.content
    else:
        cats = []
        for cat in c.content_filter_results:
            f = c.content_filter_results[cat]
            if (f.filtered):
                cats.append(cat)
        if (len(cats) > 0):
            raise ValueError(f'AI Response Was Filtered Due To: {", ".join(cats)}.')
        else:
            raise ValueError("No Response From AI")

        



