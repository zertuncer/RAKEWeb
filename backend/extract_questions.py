import urllib.request
import re
import json

urls = {
    'Mekanik': 'https://docs.google.com/forms/d/e/1FAIpQLSfNO_qIEVVOEiWct3cMStePWnoq7XwryZIKpxj1TTniSK9oog/viewform',
    'Yazilim': 'https://docs.google.com/forms/d/e/1FAIpQLScat48FRG0AYuqAkM00GpSzk2PwC1CTolr7RiuxHqCEOzjK4Q/viewform',
    'Elektronik': 'https://docs.google.com/forms/d/e/1FAIpQLSe356k9T6tajFUvTpO4lcysXpTqVbQYSH9TyhsZ4zyjjS1ILA/viewform',
    'Organizasyon': 'https://docs.google.com/forms/d/e/1FAIpQLScBLkNNr_u0SpqaM96OrWSTtbOGMTz6ypr4HsWd9I7FbYB89Q/viewform'
}

results = {}

for team, url in urls.items():
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            # Find the FB_PUBLIC_LOAD_DATA_ array
            match = re.search(r'var FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\s*</script>', html, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
                # Questions are usually in data[1][1]
                questions = []
                for item in data[1][1]:
                    if len(item) > 1 and item[1]:
                        q_text = item[1]
                        questions.append(q_text)
                results[team] = questions
    except Exception as e:
        results[team] = str(e)

with open('form_questions.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=4)
print("Done")
