from datetime import date
from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    GENDER = [("M", "Male"), ("F", "Female")]
    MARITAL = [("never", "Never married"), ("divorced", "Divorced"), ("widowed", "Widowed")]
    SECT = [("sunni", "Sunni"), ("shia", "Shia"), ("other", "Other")]
    PRAYER = [("regular", "Prays regularly"), ("sometimes", "Sometimes"), ("rarely", "Rarely")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=120)
    gender = models.CharField(max_length=1, choices=GENDER)
    date_of_birth = models.DateField()
    marital_status = models.CharField(max_length=10, choices=MARITAL, default="never")
    sect = models.CharField(max_length=10, choices=SECT, default="sunni")
    prayer = models.CharField(max_length=10, choices=PRAYER, default="regular")
    city = models.CharField(max_length=80, blank=True)
    country = models.CharField(max_length=80, default="India")
    education = models.CharField(max_length=120, blank=True)
    profession = models.CharField(max_length=120, blank=True)
    height_cm = models.PositiveSmallIntegerField(null=True, blank=True)
    about = models.TextField(blank=True)
    looking_for = models.TextField(blank=True)
    photo = models.ImageField(upload_to="photos/", null=True, blank=True)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def age(self):
        t, d = date.today(), self.date_of_birth
        return t.year - d.year - ((t.month, t.day) < (d.month, d.day))

    def __str__(self):
        return self.full_name


class Interest(models.Model):
    STATUS = [("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined")]
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="sent")
    receiver = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="received")
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sender", "receiver")
