var ClientForm = Class.create(Controller);
ClientForm.prototype.className = 'client_form';
ClientForm.cache = {};

ClientForm.addMethods({
  show: function(wizard) {
    InvoiceForm.disableAll();
    invoice_id = wizard.recordID('invoice');
    $A(invoice(invoice_id).element().getElementsByTagName("INPUT")).invoke("enable");
    var clientLayout = wizard.next('span');
    clientLayout.removeClassName('show');
    wizard.removeClassName('hide');
  },

  onSuccess: function(transport) {
    var client = transport.responseJSON;
    Client.render(client, this.form);
    this.client.show();
    this.form.stepForm.reset();
  }
});

ClientForm.init = function () {
  $$('#invoices li > header + section > fieldset').each(function (wizard) {
    wizard.observe("submit", Application.formSubmitHandler);

    wizard.stepForm = new stepsForm(wizard, {
      onSubmit: function () {
        var status = wizard.readAttribute('status');
        wizard.form.responder = client(0, wizard).client_form();
        wizard.form.overrideAction = '/clients' + (status == 'new' ? '' : '/' + wizard.readAttribute('client'));
        wizard.form.overrideMethod = status == 'new' ? 'post' : 'put';
        wizard.down('button[type="submit"]').click();
      },
      onInput: function (ev) {
        var input = ev.target,
            id = input.recordID('invoice');
        invoice(id).invoice_form().enable();
        if (input.match('input[type="email"]')) {
          new Ajax.Request("/clients/" + input.value, {
            method: 'get',
            onSuccess: function (transport) {
              var client = transport.responseJSON,
                  status = wizard.readAttribute('status'),
                  current = wizard.readAttribute('client');
              if (status == 'edit') {
                if (client.email && client.id != current) {
                  // email address already in use
                }
              } else {
                Client.render(client, wizard);
                wizard.stepForm.reset();
              }
            }
          });
        }
      },
      beforeNextQuestion: function () {
        var status = wizard.readAttribute('status');
        if (status == 'new' || status == 'edit') {
          if (status == 'new') {
          }
          return true;
        }
        if (status == 'display' && wizard.up('li#invoice_new')) {
          Invoice.create();
        }
        var id = parseInt(wizard.readAttribute('client'));
        client(id, wizard).show()
        wizard.stepForm.reset();
        return false;
      }
    });
    wizard.next('span').down('button.edit').observe('click', function(ev) {
      ev.stop();
      var id = wizard.readAttribute('client');
      wizard.writeAttribute('status', 'edit');
      client(id, wizard).client_form().show(wizard);
    });
    wizard.next('span').down('button.change').observe('click', function(ev) {
      ev.stop();
      var id = wizard.readAttribute('client');
      wizard.writeAttribute('status', 'select');
      client(id, wizard).client_form().show(wizard);
    });
    var id = parseInt(wizard.readAttribute('client'));
    wizard.writeAttribute('status', id ? 'display' : 'select');
    if (id) {
      client(id, wizard).show()
    }
  });
};


var client_form = function (id, form) {
  var instance = ClientForm.cache[id];
  if (!instance) {
    instance = new ClientForm();
    instance.id = id;
    ClientForm.cache[id] = instance;
  }
  instance.form = form;
  return instance;
};