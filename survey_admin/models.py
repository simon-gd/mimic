from django.db import models
import datetime

class CodeFile(models.Model):
    name = models.CharField(max_length=255, blank=False, null=False)
    code = models.TextField()
    created = models.DateTimeField(default=datetime.datetime.now)
    
    def __unicode__(self):
        return self.name