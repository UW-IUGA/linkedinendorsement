import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import json

IUGA_EMAIL = os.environ["IUGA_EMAIL"]
IUGA_PASSWORD = os.environ["IUGA_PASSWORD"]
EMAIL_TITLE = "LinkedIn Endorsement Week"

if __name__ == "__main__":
    server = smtplib.SMTP('smtp.uw.edu', 587)
    server.ehlo()
    server.starttls()
    server.login(IUGA_EMAIL, IUGA_PASSWORD)

    emails = {}
    with open('./emails.json', 'r') as outfile:
        emails = json.load(outfile)
        outfile.close()

    for email in emails:
        print("SENDING EMAIL TO {}".format(email['email']))
        message = MIMEMultipart('alternative')
        message['to'] = email['email']
        message['from'] = IUGA_EMAIL
        message['subject'] = 'TEST LINKEDIN POST'
        htmlToAdd = open("./testemails/{}.html".format(email["idNum"])).read()
        message.attach(MIMEText(htmlToAdd, "html"))
        try:
            server.sendmail(IUGA_EMAIL, email['email'], message.as_string())
            print("SUCCESS SENDING EMAIL TO {}".format(email['email']))
        except:
            print("FAILURE SENDING EMAIL TO {}".format(email['email']))
