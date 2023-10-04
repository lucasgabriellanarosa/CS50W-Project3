document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").addEventListener("submit", send_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-page').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function archive_logic(email){
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email.archived
    })
  }).then(() => {load_mailbox('inbox')})
}

function load_emails(mailbox){
  emailsContainer = document.getElementById('emails-view')

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // ... do something else with emails ...
      emails.forEach(email => {
        const emailBgColor = email.read ? "rgb(192, 192, 192);" : "white"

        emailCard = document.createElement('div')
        emailCard.innerHTML = `
          <div class="card" style="margin: 1rem; background-color: ${emailBgColor};">
            <div class="card-header">
              From: ${email.sender}
            </div>
            <div class="card-header">
              To: ${email.recipients}
            </div>
            <div class="card-body">
              <h6 class="card-title">${email.timestamp}</h6>
              <p class="card-text">${email.subject}</p>
              <div id="btnsContainer-${email.id}">
                <button class="btn btn-dark" onclick="email_view(${email.id})">View More</button>
              </div>
            </div>
          </div>
        `
        emailsContainer.appendChild(emailCard)

        if(mailbox != "sent"){
          btnsContainer = document.querySelector(`#btnsContainer-${email.id}`)
          
          if(email.archived){
            const unArchiveBtn = document.createElement("button")
            unArchiveBtn.innerText = "Unarchive"
            unArchiveBtn.className = "btn btn-danger"
            btnsContainer.appendChild(unArchiveBtn)
            unArchiveBtn.addEventListener("click", () => {archive_logic(email)})
          }else{
            const archiveBtn = document.createElement("button")
            archiveBtn.innerText = "Archive"
            archiveBtn.className = "btn btn-success"
            btnsContainer.appendChild(archiveBtn)
            archiveBtn.addEventListener("click", () => {archive_logic(email)})
          }
        }
      });
  });

}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page').style.display = 'none';
  

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  load_emails(mailbox)
}


function send_email(event){
  event.preventDefault();
  const recipients = document.querySelector("#compose-recipients").value
  const subject = document.querySelector("#compose-subject").value
  const body = document.querySelector("#compose-body").value

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent')
  });
}


function reply(id){
  compose_email()
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email)

    console.log(email.subject.charAt(0) + email.subject.charAt(1) + email.subject.charAt(2))
    if(email.subject.charAt(0) + email.subject.charAt(1) + email.subject.charAt(2) === "Re:"){
      reply_subject = email.subject
    }else{
      reply_subject = "Re: " + email.subject
    }
    console.log(reply_subject)

    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = reply_subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: 
${email.body}`;
  })
}


function email_view(id){
  // Show the email page and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      console.log(email);
      
      document.getElementById("email-page").innerHTML = `
      <div>
        <h4>From: ${email.sender}</h4>
        <h4>To: ${email.recipients}</h4>
        <small>${email.timestamp}</small>
        <h5>Subject: ${email.subject}</h5>
        <p>${email.body}</p>
        <button class="btn btn-primary" onclick="reply(${email.id})">Reply</button>
      </div>
      `

      if(email.read===false){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })        
      }

  });
}

