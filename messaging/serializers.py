from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['project', 'sender', 'timestamp']
        extra_fields = ['sender_username']

    def get_sender_username(self, obj):
        return getattr(obj.sender, 'username', None)